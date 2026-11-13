import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, unique: true },
    items: [
      {
        product: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    subtotal: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, default: "Cash" },
    customer: mongoose.Schema.Types.ObjectId,
    cashier: String,
  },
  { timestamps: true },
);

export default mongoose.model("Sale", saleSchema);
