import Product from "../models/Product.model.js";
import Sale from "../models/Sale.model.js";
import StockMovement from "../models/StockMovement.model.js";

export const findSales = (limit) =>
  Sale.find().sort({ createdAt: -1 }).limit(limit);

function getStockChanges(previousItems = [], nextItems = []) {
  const changes = new Map();
  for (const item of previousItems) {
    const id = String(item.product?._id || item.product);
    changes.set(id, (changes.get(id) || 0) + Number(item.quantity));
  }
  for (const item of nextItems) {
    const id = String(item.product?._id || item.product);
    changes.set(id, (changes.get(id) || 0) - Number(item.quantity));
  }
  return changes;
}

async function reconcileStock(previousItems, nextItems, note) {
  const changes = getStockChanges(previousItems, nextItems);
  const products = [];
  for (const [id, quantity] of changes) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error(`Product not found: ${id}`);
      error.status = 400;
      throw error;
    }
    if (product.stock + quantity < 0) {
      const error = new Error(`Not enough stock for ${product.name}`);
      error.status = 409;
      throw error;
    }
    products.push({ product, quantity });
  }
  for (const { product, quantity } of products) {
    if (!quantity) continue;
    product.stock += quantity;
    await product.save();
    await StockMovement.create({
      product: product._id,
      type: quantity < 0 ? "Sold" : "Adjusted",
      quantity,
      note,
    });
  }
}

function validateSale(data) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    const error = new Error("A sale must contain at least one product");
    error.status = 400;
    throw error;
  }
  for (const item of data.items) {
    if (
      !item.product ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) <= 0
    ) {
      const error = new Error(
        "Sale items require a product and a positive quantity",
      );
      error.status = 400;
      throw error;
    }
  }
}

export async function createSale(data) {
  validateSale(data);
  await reconcileStock([], data.items, "New sale");
  return Sale.create({ ...data, receiptNo: `FM-${Date.now()}` });
}

export async function updateSale(id, data) {
  const sale = await Sale.findById(id);
  if (!sale) return null;
  if (data.items) {
    validateSale(data);
    await reconcileStock(
      sale.items,
      data.items,
      `Updated sale ${sale.receiptNo}`,
    );
  }
  const updatedItems = data.items || sale.items;
  const subtotal =
    data.subtotal ??
    updatedItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
  Object.assign(sale, data, {
    subtotal,
    total: Math.max(0, subtotal - Number(data.discount ?? sale.discount ?? 0)),
  });
  return sale.save();
}

export async function deleteSale(id) {
  const sale = await Sale.findById(id);
  if (!sale) return null;
  await reconcileStock(sale.items, [], `Voided sale ${sale.receiptNo}`);
  await sale.deleteOne();
  return sale;
}
