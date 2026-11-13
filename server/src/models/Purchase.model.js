import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    invoiceNo: String,
    invoiceUrl: String,
    items: [
      {
        product: mongoose.Schema.Types.ObjectId,
        quantity: Number,
        cost: Number,
        batch: String,
        expiryDate: Date,
      },
    ],
    status: {
      type: String,
      enum: ["Draft", "Ordered", "Received", "Cancelled"],
      default: "Draft",
    },
    total: Number,
    expectedDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Purchase", purchaseSchema);
