import asyncHandler from "../middleware/asyncHandler.js";
import * as suppliers from "../services/supplier.service.js";

export const getSuppliers = asyncHandler(async (_req, res) =>
  res.json(await suppliers.findSuppliers()),
);

export const createSupplier = asyncHandler(async (req, res) =>
  res.status(201).json(await suppliers.createSupplier(req.body)),
);

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await suppliers.updateSupplier(req.params.id, req.body);
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  res.json(supplier);
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await suppliers.deleteSupplier(req.params.id);
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  res.status(204).end();
});
