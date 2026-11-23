import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${Buffer.from(hash).toString("hex")}`;
}

export async function verifyPassword(password, storedHash = "") {
  if (typeof password !== "string") return false;
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex || !/^[0-9a-f]{128}$/i.test(expectedHex)) {
    return false;
  }
  const actual = Buffer.from(await scrypt(password, salt, KEY_LENGTH));
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 10;
}
