import asyncHandler from "../middleware/asyncHandler.js";
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

export const getSettings = asyncHandler(async (_req, res) =>
  res.json(await settings.getSettings()),
);

export const updateStoreSettings = asyncHandler(async (req, res) =>
  res.json(await settings.updateStoreSettings(req.body)),
);

const branches = resourceController({
  create: settings.createBranch,
  update: settings.updateBranch,
  remove: settings.deleteBranch,
  label: "Branch",
});
export const createBranch = branches.create;
export const updateBranch = branches.update;
export const deleteBranch = branches.remove;

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
