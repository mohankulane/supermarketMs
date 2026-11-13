import asyncHandler from "../middleware/asyncHandler.js";
import * as shifts from "../services/shift.service.js";

export const getShifts = asyncHandler(async (_req, res) =>
  res.json(await shifts.findShifts()),
);

export const openShift = asyncHandler(async (req, res) =>
  res.status(201).json(await shifts.openShift(req.body)),
);

export const closeShift = asyncHandler(async (req, res) => {
  const shift = await shifts.closeShift(req.params.id, req.body);
  if (!shift) return res.status(404).json({ error: "Shift not found" });
  res.json(shift);
});

export const deleteShift = asyncHandler(async (req, res) => {
  const shift = await shifts.deleteShift(req.params.id);
  if (!shift) return res.status(404).json({ error: "Shift not found" });
  res.status(204).end();
});
