import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, default: "Cash" },
    note: String,
    paidAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

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
    paidAmount: { type: Number, default: 0, min: 0 },
    payments: { type: [paymentSchema], default: [] },
    expectedDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Purchase", purchaseSchema);
