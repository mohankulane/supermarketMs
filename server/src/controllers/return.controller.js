import asyncHandler from "../middleware/asyncHandler.js";
import * as returns from "../services/return.service.js";

export const getReturns = asyncHandler(async (_req, res) =>
  res.json(await returns.findReturns()),
);

export const createReturn = asyncHandler(async (req, res) =>
  res.status(201).json(await returns.createReturn(req.body)),
);

export const updateReturn = asyncHandler(async (req, res) => {
  const record = await returns.updateReturn(req.params.id, req.body);
  if (!record) return res.status(404).json({ error: "Return not found" });
  res.json(record);
});

export const deleteReturn = asyncHandler(async (req, res) => {
  const record = await returns.deleteReturn(req.params.id);
  if (!record) return res.status(404).json({ error: "Return not found" });
  res.status(204).end();
});
