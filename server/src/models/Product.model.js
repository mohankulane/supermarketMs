import mongoose from "mongoose";
import Counter from "./Counter.model.js";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    sku: { type: String, required: true, unique: true, immutable: true },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      set: (value) => value?.trim() || undefined,
    },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    variants: [{ name: String, value: String, sku: String, price: Number }],
    unit: { type: String, default: "Each" },
    conversions: [{ from: String, to: String, factor: Number }],
  },
  { timestamps: true },
);

productSchema.pre("validate", async function generateSku() {
  if (!this.isNew || this.sku) return;
  while (!this.sku) {
    const counter = await Counter.findOneAndUpdate(
      { _id: "product-sku" },
      { $inc: { sequence: 1 } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    const sku = `FM-${String(counter.sequence).padStart(6, "0")}`;
    if (!(await this.constructor.exists({ sku }))) this.sku = sku;
  }
});

export default mongoose.model("Product", productSchema);
