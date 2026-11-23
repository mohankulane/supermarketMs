import mongoose from "mongoose";

const storeSettingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "primary" },
    setupComplete: { type: Boolean, default: false },
    name: { type: String, default: "FreshMart Supermarket" },
    logoUrl: { type: String, default: "" },
    receiptFooter: {
      type: String,
      default: "Thank you for shopping with FreshMart.",
    },
    currency: { type: String, enum: ["USD"], default: "USD" },
    taxRate: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("StoreSetting", storeSettingSchema);
