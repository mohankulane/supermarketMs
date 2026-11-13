import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    type: {
      type: String,
      enum: ["Received", "Sold", "Adjusted", "Returned"],
      required: true,
    },
    quantity: Number,
    note: String,
    user: String,
  },
  { timestamps: true },
);

export default mongoose.model("StockMovement", stockMovementSchema);
