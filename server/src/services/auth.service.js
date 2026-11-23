import "dotenv/config";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import StoreSetting from "../models/StoreSetting.model.js";
import TeamMember from "../models/TeamMember.model.js";
import { hashPassword, validatePassword, verifyPassword } from "../security/passwords.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissions,
  toPublicUser,
} from "../security/permissions.js";

const COOKIE_NAME = "freshmart_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? ""
    : randomBytes(32).toString("hex"));

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured in production.");
}

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createToken(userId) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: String(userId),
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

function readSessionCookie(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cookie ? decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)) : "";
}

export function setSessionCookie(res, userId) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${createToken(userId)}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0${secure}`,
  );
}

export async function getSetupStatus() {
  const setting = await StoreSetting.findOne({ key: "primary" }).select(
    "setupComplete name logoUrl",
  );
  return {
    setupRequired: !setting?.setupComplete,
    storeName: setting?.name || "FreshMart Supermarket",
    logoUrl: setting?.logoUrl || "",
  };
}

export async function createInitialOwner({ name, email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!String(name || "").trim() || !normalizedEmail) {
    throw createError("Name and email are required.", 400);
  }
  if (!validatePassword(password)) {
    throw createError("Password must be at least 10 characters.", 400);
  }

  await StoreSetting.updateOne(
    { key: "primary" },
    { $setOnInsert: { key: "primary", setupComplete: false } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  const claimed = await StoreSetting.findOneAndUpdate(
    { key: "primary", setupComplete: { $ne: true } },
    { $set: { setupComplete: true } },
    { new: true },
  );
  if (!claimed) throw createError("Initial setup has already been completed.", 409);

  try {
    let owner = await TeamMember.findOne({ email: normalizedEmail }).select(
      "+passwordHash",
    );
    if (owner?.passwordHash) {
      throw createError("That email already has a sign-in account.", 409);
    }
    const values = {
      name: String(name).trim(),
      email: normalizedEmail,
      role: "Owner",
      status: "Active",
      permissions: [...DEFAULT_ROLE_PERMISSIONS.Owner],
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    };
    if (owner) {
      Object.assign(owner, values);
      owner = await owner.save();
    } else {
      owner = await TeamMember.create(values);
    }
    return owner;
  } catch (error) {
    await StoreSetting.updateOne(
      { key: "primary" },
      { $set: { setupComplete: false } },
    );
    throw error;
  }
}

export async function login({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await TeamMember.findOne({ email: normalizedEmail }).select(
    "+passwordHash",
  );
  if (
    !user ||
    user.status !== "Active" ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    throw createError("Email or password is incorrect.", 401);
  }
  return { user, publicUser: toPublicUser(user) };
}

export async function authenticateRequest(req) {
  const token = verifyToken(readSessionCookie(req));
  if (!token?.sub) return null;
  const user = await TeamMember.findById(token.sub);
  if (!user || user.status !== "Active") return null;
  return toPublicUser(user);
}

const AVATAR_PATTERN = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i;
const MAX_AVATAR_LENGTH = 700_000;

export async function updateAvatar(userId, avatarUrl) {
  const value = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (value && !AVATAR_PATTERN.test(value)) {
    throw createError("Profile photo must be a PNG, JPEG or WebP image.", 400);
  }
  if (value.length > MAX_AVATAR_LENGTH) {
    throw createError("Profile photo is too large. Choose a smaller image.", 413);
  }
  const user = await TeamMember.findById(userId);
  if (!user) throw createError("Account not found.", 404);
  user.avatarUrl = value;
  await user.save();
  return toPublicUser(user);
}

export async function changePassword(userId, password) {
  if (!validatePassword(password)) {
    throw createError("Password must be at least 10 characters.", 400);
  }
  const user = await TeamMember.findById(userId);
  if (!user) throw createError("Account not found.", 404);
  user.passwordHash = await hashPassword(password);
  user.mustChangePassword = false;
  await user.save();
  return toPublicUser(user);
}
