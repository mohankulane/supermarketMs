import Branch from "../models/Branch.model.js";
import PaymentMethod from "../models/PaymentMethod.model.js";
import StoreSetting from "../models/StoreSetting.model.js";
import TeamMember from "../models/TeamMember.model.js";

export async function getSettings() {
  const [store] = await Promise.all([
    StoreSetting.findOneAndUpdate(
      { key: "primary" },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);
  if (!(await Branch.exists({}))) {
    await Branch.create({ name: "Main Branch", isMain: true });
  }
  if (!(await PaymentMethod.exists({}))) {
    await PaymentMethod.insertMany([
      { name: "Cash", isDefault: true },
      { name: "Card" },
      { name: "M-Pesa" },
    ]);
  }
  const [branches, paymentMethods, users] = await Promise.all([
    Branch.find().sort({ isMain: -1, createdAt: 1 }),
    PaymentMethod.find().sort({ isDefault: -1, name: 1 }),
    TeamMember.find().sort({ createdAt: 1 }),
  ]);
  return { store, branches, paymentMethods, users };
}

export const updateStoreSettings = (data) =>
  StoreSetting.findOneAndUpdate(
    { key: "primary" },
    { $set: data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

export const createBranch = (data) => Branch.create(data);
export async function updateBranch(id, data) {
  const branch = await Branch.findById(id);
  if (!branch) return null;
  if (data.isMain)
    await Branch.updateMany({ _id: { $ne: id } }, { isMain: false });
  Object.assign(branch, data);
  return branch.save();
}

export async function deleteBranch(id) {
  const branch = await Branch.findById(id);
  if (!branch) return null;
  if (branch.isMain) {
    const error = new Error(
      "Set another branch as the main branch before removing this one",
    );
    error.status = 409;
    throw error;
  }
  await branch.deleteOne();
  return branch;
}

export async function createPaymentMethod(data) {
  if (data.isDefault) {
    await PaymentMethod.updateMany({}, { isDefault: false });
  }
  return PaymentMethod.create(data);
}

export async function updatePaymentMethod(id, data) {
  if (data.isDefault) {
    await PaymentMethod.updateMany({ _id: { $ne: id } }, { isDefault: false });
  }
  return PaymentMethod.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

export async function deletePaymentMethod(id) {
  const method = await PaymentMethod.findById(id);
  if (!method) return null;
  if (method.isDefault) {
    const error = new Error(
      "Choose another default payment method before removing this one",
    );
    error.status = 409;
    throw error;
  }
  await method.deleteOne();
  return method;
}

export const createTeamMember = (data) => TeamMember.create(data);
export const updateTeamMember = (id, data) =>
  TeamMember.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export const deleteTeamMember = (id) => TeamMember.findByIdAndDelete(id);
