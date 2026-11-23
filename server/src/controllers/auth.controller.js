import asyncHandler from "../middleware/asyncHandler.js";
import { toPublicUser } from "../security/permissions.js";
import {
  changePassword,
  clearSessionCookie,
  createInitialOwner,
  getSetupStatus,
  login,
  setSessionCookie,
  updateAvatar,
} from "../services/auth.service.js";

export const setupStatus = asyncHandler(async (_req, res) =>
  res.json(await getSetupStatus()),
);

export const setupOwner = asyncHandler(async (req, res) => {
  const user = await createInitialOwner(req.body);
  setSessionCookie(res, user._id);
  res.status(201).json(toPublicUser(user));
});

export const signIn = asyncHandler(async (req, res) => {
  const { user, publicUser } = await login(req.body);
  setSessionCookie(res, user._id);
  res.json(publicUser);
});

export const currentUser = asyncHandler(async (req, res) =>
  res.json(req.user),
);

export const signOut = asyncHandler(async (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

export const updateProfilePhoto = asyncHandler(async (req, res) => {
  const user = await updateAvatar(req.user._id, req.body.avatarUrl);
  res.json(user);
});

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await changePassword(req.user._id, req.body.password);
  res.json(user);
});
