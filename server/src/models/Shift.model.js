import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    cashier: { type: String, required: true },
    openingCash: Number,
    expectedCash: Number,
    closingCash: Number,
    variance: Number,
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  },
  { timestamps: true },
);

export default mongoose.model("Shift", shiftSchema);
