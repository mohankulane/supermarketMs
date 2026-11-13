import asyncHandler from "../middleware/asyncHandler.js";
import * as products from "../services/product.service.js";

export const getProducts = asyncHandler(async (req, res) =>
  res.json(await products.findProducts(req.query.search)),
);

export const getProduct = asyncHandler(async (req, res) => {
  const product = await products.findProductById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) =>
  res
    .status(201)
    .json(await products.createProduct(validateProductImage(req.body))),
);

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await products.updateProduct(
    req.params.id,
    validateProductImage(req.body),
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

function validateProductImage(data) {
  if (
    data.image &&
    (!data.image.startsWith("data:image/") || data.image.length > 5_000_000)
  ) {
    const error = new Error(
      "Product image must be an image smaller than 3.5 MB",
    );
    error.status = 400;
    throw error;
  }
  return data;
}

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await products.deleteProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.status(204).end();
});

export const adjustStock = asyncHandler(async (req, res) => {
  const product = await products.adjustStock(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

export const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await products.findProductByBarcode(req.params.barcode);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});
