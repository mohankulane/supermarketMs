import Purchase from "../models/Purchase.model.js";
import Product from "../models/Product.model.js";
import StockMovement from "../models/StockMovement.model.js";

function purchaseTotal(items) {
  if (!Array.isArray(items) || !items.length) {
    const error = new Error("Add at least one product to the purchase.");
    error.status = 400;
    throw error;
  }
  const total = items.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const cost = Number(item.cost);
    if (!item.product || !Number.isFinite(quantity) || quantity <= 0 ||
      !Number.isFinite(cost) || cost < 0) {
      const error = new Error("Each purchase item needs a product, quantity, and valid cost.");
      error.status = 400;
      throw error;
    }
    return sum + quantity * cost;
  }, 0);
  return Math.round(total * 100) / 100;
}

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

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
  const total = purchaseTotal(data.items);
  const enteredPayment = Number(data.paidAmount || 0);
  const paidAmount = Math.round(enteredPayment * 100) / 100;
  if (
    !Number.isFinite(enteredPayment) ||
    enteredPayment < 0 ||
    Math.abs(enteredPayment - paidAmount) > 0.001 ||
    paidAmount > total
  ) {
    throw requestError("The initial payment must be between zero and the purchase total.");
  }
  const { paymentMethod = "Cash", ...purchaseData } = data;
  purchaseData.total = total;
  purchaseData.paidAmount = paidAmount;
  purchaseData.payments =
    paidAmount > 0
      ? [{ amount: paidAmount, method: paymentMethod, note: "Initial payment" }]
      : [];
  if (data.status === "Received") {
    await applyStock(
      [],
      data.items,
      `Purchase ${data.invoiceNo || "received"}`,
    );
  }
  const purchase = await Purchase.create(purchaseData);
  return purchase;
}

export async function updatePurchase(id, data) {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  const oldItems = purchase.status === "Received" ? purchase.items : [];
  const nextStatus = data.status ?? purchase.status;
  const nextItems = data.items ?? purchase.items;
  const nextTotal =
    data.items === undefined ? purchase.total : purchaseTotal(nextItems);
  if (Number(purchase.paidAmount || 0) > Number(nextTotal || 0)) {
    throw requestError("The purchase total cannot be lower than its amount already paid.", 409);
  }
  if (nextStatus === "Cancelled" && Number(purchase.paidAmount || 0) > 0) {
    throw requestError(
      "A purchase with recorded payments cannot be cancelled until those payments are resolved.",
      409,
    );
  }
  const newItems = nextStatus === "Received" ? nextItems : [];
  await applyStock(
    oldItems,
    newItems,
    `Updated purchase ${purchase.invoiceNo || purchase._id}`,
  );
  const { paidAmount, payments, paymentMethod, total, ...updateData } = data;
  Object.assign(purchase, updateData);
  purchase.total = nextTotal;
  return purchase.save();
}

export async function recordPurchasePayment(id, data) {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  if (purchase.status === "Cancelled") {
    throw requestError("Payments cannot be recorded on a cancelled purchase.", 409);
  }
  const enteredAmount = Number(data.amount);
  const amount = Math.round(enteredAmount * 100) / 100;
  const paidAmount = Number(purchase.paidAmount || 0);
  const outstanding = Math.max(0, Number(purchase.total || 0) - paidAmount);
  if (
    !Number.isFinite(enteredAmount) ||
    Math.abs(enteredAmount - amount) > 0.001 ||
    amount <= 0
  ) {
    throw requestError("Enter a payment amount greater than zero.");
  }
  if (amount > outstanding + 0.001) {
    throw requestError("The payment cannot exceed the outstanding balance.", 409);
  }
  purchase.payments.push({
    amount,
    method: String(data.method || "Cash").trim() || "Cash",
    note: String(data.note || "").trim(),
  });
  purchase.paidAmount = Math.round((paidAmount + amount) * 100) / 100;
  return purchase.save();
}

export const updatePurchaseStatus = async (id, status) =>
  updatePurchase(id, { status });

export async function deletePurchase(id) {
  const purchase = await Purchase.findById(id);
  if (!purchase) return null;
  if (Number(purchase.paidAmount || 0) > 0) {
    throw requestError(
      "A purchase with recorded payments cannot be deleted. Resolve its supplier balance first.",
      409,
    );
  }
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
