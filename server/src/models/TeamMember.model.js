import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["Owner", "Manager", "Cashier"],
      default: "Cashier",
    },
    permissions: { type: [String], default: undefined },
    passwordHash: { type: String, select: false },
    mustChangePassword: { type: Boolean, default: false },
    avatarUrl: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true },
);

export default mongoose.model("TeamMember", teamMemberSchema);
