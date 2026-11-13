import Purchase from "../models/Purchase.model.js";
import Product from "../models/Product.model.js";
import StockMovement from "../models/StockMovement.model.js";

export const findPurchases = () =>
  Purchase.find()
    .populate("supplier")
    .populate("items.product")
    .sort({ createdAt: -1 });

async function applyStock(previousItems = [], nextItems = [], note) {
  const changes = new Map();
  for (const item of previousItems) {
    const id = String(item.product?._id || item.product);
    changes.set(id, (changes.get(id) || 0) - Number(item.quantity));
  }
  for (const item of nextItems) {
    const id = String(item.product?._id || item.product);
    changes.set(id, (changes.get(id) || 0) + Number(item.quantity));
  }
  const products = [];
  for (const [id, quantity] of changes) {
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error(`Product not found: ${id}`);
      error.status = 400;
      throw error;
    }
    if (product.stock + quantity < 0) {
      const error = new Error(
        `Not enough stock to update purchase for ${product.name}`,
      );
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
      type: quantity > 0 ? "Received" : "Adjusted",
      quantity,
      note,
    });
  }
}

export async function createPurchase(data) {
  if (data.status === "Received") {
    await applyStock(
      [],
      data.items,
      `Purchase ${data.invoiceNo || "received"}`,
    );
  }
  const purchase = await Purchase.create(data);
  return purchase;
}

export async function updatePurchase(id, data) {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  const oldItems = purchase.status === "Received" ? purchase.items : [];
  const nextStatus = data.status ?? purchase.status;
  const nextItems = data.items ?? purchase.items;
  const newItems = nextStatus === "Received" ? nextItems : [];
  await applyStock(
    oldItems,
    newItems,
    `Updated purchase ${purchase.invoiceNo || purchase._id}`,
  );
  Object.assign(purchase, data);
  return purchase.save();
}

export const updatePurchaseStatus = async (id, status) =>
  updatePurchase(id, { status });

export async function deletePurchase(id) {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  if (purchase.status === "Received") {
    await applyStock(
      purchase.items,
      [],
      `Deleted purchase ${purchase.invoiceNo || purchase._id}`,
    );
  }
  await purchase.deleteOne();
  return purchase;
}
