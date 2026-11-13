import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: String,
    email: String,
    status: { type: String, default: "Active" },
  },
  { timestamps: true },
);

export default mongoose.model("Supplier", supplierSchema);
