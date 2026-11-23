import asyncHandler from "../middleware/asyncHandler.js";
import { hasPermission, toPublicUser } from "../security/permissions.js";
import * as settings from "../services/settings.service.js";

function resourceController({ create, update, remove, label }) {
  return {
    create: asyncHandler(async (req, res) =>
      res.status(201).json(await create(req.body)),
    ),
    update: asyncHandler(async (req, res) => {
      const item = await update(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: `${label} not found` });
      res.json(item);
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await remove(req.params.id);
      if (!item) return res.status(404).json({ error: `${label} not found` });
      res.status(204).end();
    }),
  };
}

export const getSettings = asyncHandler(async (req, res) => {
  const data = await settings.getSettings();
  if (req.path === "/users") {
    return res.json(await settings.getTeamMembers());
  }
  if (!hasPermission(req.user, "settings:manage")) {
    return res.json({
      store: {
        name: data.store.name,
        logoUrl: data.store.logoUrl,
        currency: data.store.currency,
      },
      paymentMethods: data.paymentMethods.filter(
        (method) => method.status === "Active",
      ),
      users: [],
    });
  }
  res.json({
    ...data,
    users:
      req.user.role === "Owner"
        ? data.users.map(toPublicUser)
        : [],
  });
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  const { logoUrl } = req.body;
  if (
    logoUrl &&
    !/^https?:\/\/\S+$/i.test(logoUrl) &&
    !/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(logoUrl)
  ) {
    return res.status(400).json({ error: "Choose a PNG, JPEG, or WebP logo." });
  }
  if (logoUrl?.startsWith("data:") && logoUrl.length > 5_000_000) {
    return res.status(400).json({ error: "Logo file must be smaller than 3.5 MB." });
  }
  res.json(await settings.updateStoreSettings(req.body));
});

const paymentMethods = resourceController({
  create: settings.createPaymentMethod,
  update: settings.updatePaymentMethod,
  remove: settings.deletePaymentMethod,
  label: "Payment method",
});
export const createPaymentMethod = paymentMethods.create;
export const updatePaymentMethod = paymentMethods.update;
export const deletePaymentMethod = paymentMethods.remove;

const teamMembers = resourceController({
  create: settings.createTeamMember,
  update: settings.updateTeamMember,
  remove: settings.deleteTeamMember,
  label: "Team member",
});
export const createTeamMember = teamMembers.create;
export const updateTeamMember = teamMembers.update;
export const deleteTeamMember = teamMembers.remove;
