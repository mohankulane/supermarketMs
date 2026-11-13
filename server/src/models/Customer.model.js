import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: String,
    email: String,
    visits: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("Customer", customerSchema);
