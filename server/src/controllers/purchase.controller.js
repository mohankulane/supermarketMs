import asyncHandler from "../middleware/asyncHandler.js";
import * as purchases from "../services/purchase.service.js";

export const getPurchases = asyncHandler(async (_req, res) =>
  res.json(await purchases.findPurchases()),
);

export const createPurchase = asyncHandler(async (req, res) =>
  res.status(201).json(await purchases.createPurchase(req.body)),
);

export const updatePurchase = asyncHandler(async (req, res) => {
  const purchase = await purchases.updatePurchase(req.params.id, req.body);
  if (!purchase) return res.status(404).json({ error: "Purchase not found" });
  res.json(purchase);
});

export const deletePurchase = asyncHandler(async (req, res) => {
  const purchase = await purchases.deletePurchase(req.params.id);
  if (!purchase) return res.status(404).json({ error: "Purchase not found" });
  res.status(204).end();
});
