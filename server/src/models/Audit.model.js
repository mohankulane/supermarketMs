import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    actor: String,
    action: String,
    entity: String,
    entityId: String,
    details: String,
  },
  { timestamps: true },
);

export default mongoose.model("Audit", auditSchema);
