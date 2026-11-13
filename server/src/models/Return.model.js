import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
        reason: String,
      },
    ],
    refundAmount: Number,
    status: { type: String, default: "Completed" },
  },
  { timestamps: true },
);

export default mongoose.model("Return", returnSchema);
