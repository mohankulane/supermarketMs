import Product from "../models/Product.model.js";
import Return from "../models/Return.model.js";
import Sale from "../models/Sale.model.js";
import StockMovement from "../models/StockMovement.model.js";

export const findReturns = () =>
  Return.find().populate("items.product").sort({ createdAt: -1 });

async function validateSaleQuantities(
  saleId,
  items,
  refundAmount,
  exceptReturnId,
) {
  const sale = await Sale.findById(saleId);
  if (!sale) {
    const error = new Error("The invoice for this return was not found");
    error.status = 404;
    throw error;
  }

  const existingReturns = await Return.find({
    sale: saleId,
    status: "Completed",
    ...(exceptReturnId ? { _id: { $ne: exceptReturnId } } : {}),
  });
  const sold = new Map();
  const soldValue = new Map();
  const returned = new Map();
  let subtotal = 0;
  for (const item of sale.items) {
    const productId = String(item.product);
    const quantity = Number(item.quantity || 0);
    const value = Number(item.price || 0) * quantity;
    sold.set(productId, (sold.get(productId) || 0) + quantity);
    soldValue.set(productId, (soldValue.get(productId) || 0) + value);
    subtotal += value;
  }
  for (const record of existingReturns) {
    for (const item of record.items) {
      const productId = String(item.product);
      returned.set(
        productId,
        (returned.get(productId) || 0) + Number(item.quantity),
      );
    }
  }
  const requested = new Map();
  for (const item of items) {
    const productId = String(item.product?._id || item.product);
    requested.set(
      productId,
      (requested.get(productId) || 0) + Number(item.quantity),
    );
  }
  const total = Number(sale.total ?? subtotal - Number(sale.discount || 0));
  const priceFactor =
    subtotal > 0 ? Math.min(1, Math.max(0, total / subtotal)) : 1;
  let maximumRefund = 0;
  for (const [productId, quantity] of requested) {
    const remaining =
      (sold.get(productId) || 0) - (returned.get(productId) || 0);
    if (!sold.has(productId) || quantity > remaining) {
      const error = new Error(
        "Return quantity exceeds the remaining quantity on this invoice",
      );
      error.status = 409;
      throw error;
    }
    maximumRefund +=
      ((soldValue.get(productId) || 0) / sold.get(productId)) *
      quantity *
      priceFactor;
  }
  const refund = Number(refundAmount);
  if (!Number.isFinite(refund) || refund < 0) {
    const error = new Error("Refund amount must be a non-negative number");
    error.status = 400;
    throw error;
  }
  if (refund > maximumRefund + 0.01) {
    const error = new Error(
      "Refund amount exceeds the value of the returned items",
    );
    error.status = 409;
    throw error;
  }
}

export async function createReturn(data) {
  if (!Array.isArray(data.items) || !data.items.length) {
    const error = new Error("A return must contain at least one product");
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
        "Return items require a product and a positive quantity",
      );
      error.status = 400;
      throw error;
    }
  }
  if (data.sale && (data.status || "Completed") === "Completed") {
    await validateSaleQuantities(
      data.sale,
      data.items,
      data.refundAmount,
    );
  }
  if ((data.status || "Completed") === "Completed") {
    await reconcileReturnStock([], data.items, "Customer return");
  }
  return Return.create(data);
}

async function reconcileReturnStock(previousItems, nextItems, note) {
  const quantities = new Map();
  for (const item of previousItems || []) {
    const id = String(item.product?._id || item.product);
    quantities.set(id, (quantities.get(id) || 0) - Number(item.quantity));
  }
  for (const item of nextItems || []) {
    const id = String(item.product?._id || item.product);
    quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity));
  }
  for (const [id, quantity] of quantities) {
    if (!quantity) continue;
    const product = await Product.findById(id);
    if (!product) {
      const error = new Error(`Product not found: ${id}`);
      error.status = 400;
      throw error;
    }
    if (product.stock + quantity < 0) {
      const error = new Error(
        `Not enough stock to remove this return for ${product.name}`,
      );
      error.status = 409;
      throw error;
    }
    product.stock += quantity;
    await product.save();
    await StockMovement.create({
      product: product._id,
      type: quantity > 0 ? "Returned" : "Adjusted",
      quantity,
      note,
    });
  }
}

export async function updateReturn(id, data) {
  const record = await Return.findById(id);
  if (!record) return null;
  const saleId = data.sale ?? record.sale;
  const previousItems = record.status === "Completed" ? record.items : [];
  const nextStatus = data.status ?? record.status;
  const nextItems =
    nextStatus === "Completed" ? (data.items ?? record.items) : [];
  if (saleId && nextStatus === "Completed") {
    await validateSaleQuantities(
      saleId,
      nextItems,
      data.refundAmount ?? record.refundAmount,
      record._id,
    );
  }
  await reconcileReturnStock(
    previousItems,
    nextItems,
    `Updated return ${record._id}`,
  );
  Object.assign(record, data);
  return record.save();
}

export async function deleteReturn(id) {
  const record = await Return.findById(id);
  if (!record) return null;
  if (record.status === "Completed") {
    await reconcileReturnStock(
      record.items,
      [],
      `Deleted return ${record._id}`,
    );
  }
  await record.deleteOne();
  return record;
}
