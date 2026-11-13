import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    isMain: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Branch", branchSchema);
