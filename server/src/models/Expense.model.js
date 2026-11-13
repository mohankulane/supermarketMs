import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: String,
    paymentMethod: String,
    expenseDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Expense", expenseSchema);
