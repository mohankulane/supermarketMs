import Product from "../models/Product.model.js";
import Purchase from "../models/Purchase.model.js";
import Return from "../models/Return.model.js";
import Sale from "../models/Sale.model.js";
import StockMovement from "../models/StockMovement.model.js";

export const findProducts = (search) => {
  const filter = search
    ? {
        $or: [
          { name: new RegExp(search, "i") },
          { sku: new RegExp(search, "i") },
        ],
      }
    : {};
  return Product.find(filter).sort({ createdAt: -1 });
};

export const createProduct = (data) => Product.create(data);

export const updateProduct = (id, data) =>
  Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export async function deleteProduct(id) {
  const [product, sale, purchase, returned] = await Promise.all([
    Product.findById(id),
    Sale.exists({ "items.product": id }),
    Purchase.exists({ "items.product": id }),
    Return.exists({ "items.product": id }),
  ]);
  if (!product) return null;
  if (sale || purchase || returned) {
    const error = new Error(
      "This product has transaction history and cannot be deleted. Set its stock to zero instead.",
    );
    error.status = 409;
    throw error;
  }
  await product.deleteOne();
  return product;
}

export async function adjustStock(
  id,
  { quantity, type = "Adjusted", note = "" },
) {
  const amount = Number(quantity);
  if (!Number.isFinite(amount) || amount === 0) {
    const error = new Error("Stock adjustment must be a non-zero number");
    error.status = 400;
    throw error;
  }
  const product = await Product.findById(id);
  if (!product) return null;
  if (product.stock + amount < 0) {
    const error = new Error("Stock cannot be reduced below zero");
    error.status = 409;
    throw error;
  }
  product.stock += amount;
  await product.save();
  await StockMovement.create({
    product: product._id,
    quantity: amount,
    type,
    note,
  });
  return product;
}

export const findProductByBarcode = (barcode) =>
  Product.findOne({ $or: [{ barcode }, { sku: barcode }] });

export const findProductById = (id) => Product.findById(id);
