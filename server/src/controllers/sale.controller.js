import asyncHandler from "../middleware/asyncHandler.js";
import * as sales from "../services/sale.service.js";

export const getSales = asyncHandler(async (req, res) => {
  const limit =
    req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 0) {
    return res
      .status(400)
      .json({ error: "Sale limit must be a non-negative integer" });
  }
  res.json(await sales.findSales(limit));
});

export const createSale = asyncHandler(async (req, res) =>
  res.status(201).json(await sales.createSale(req.body)),
);

export const updateSale = asyncHandler(async (req, res) => {
  const sale = await sales.updateSale(req.params.id, req.body);
  if (!sale) return res.status(404).json({ error: "Sale not found" });
  res.json(sale);
});

export const deleteSale = asyncHandler(async (req, res) => {
  const sale = await sales.deleteSale(req.params.id);
  if (!sale) return res.status(404).json({ error: "Sale not found" });
  res.status(204).end();
});
