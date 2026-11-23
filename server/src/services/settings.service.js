import PaymentMethod from "../models/PaymentMethod.model.js";
import StoreSetting from "../models/StoreSetting.model.js";
import TeamMember from "../models/TeamMember.model.js";
import { hashPassword, validatePassword } from "../security/passwords.js";
import {
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissions,
  toPublicUser,
} from "../security/permissions.js";

export async function getSettings() {
  const [store] = await Promise.all([
    StoreSetting.findOneAndUpdate(
      { key: "primary" },
      {},
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  ]);
  if (!(await PaymentMethod.exists({}))) {
    await PaymentMethod.insertMany([
      { name: "Cash", isDefault: true },
      { name: "Card" },
      { name: "M-Pesa" },
    ]);
  }
  const [paymentMethods, users] = await Promise.all([
    PaymentMethod.find().sort({ isDefault: -1, name: 1 }),
    TeamMember.find().sort({ createdAt: 1 }),
  ]);
  return { store, paymentMethods, users };
}

export const updateStoreSettings = (data) =>
  StoreSetting.findOneAndUpdate(
    { key: "primary" },
    { $set: data },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

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

export async function getTeamMembers() {
  const users = await TeamMember.find().sort({ createdAt: 1 });
  return users.map(toPublicUser);
}

export async function createTeamMember(data) {
  if (!validatePassword(data.password)) {
    const error = new Error("Password must be at least 10 characters.");
    error.status = 400;
    throw error;
  }
  if (data.permissions !== undefined && !Array.isArray(data.permissions)) {
    const error = new Error("Permissions must be a list.");
    error.status = 400;
    throw error;
  }
  const role = data.role || "Cashier";
  const user = await TeamMember.create({
    name: data.name,
    email: data.email,
    role,
    status: data.status || "Active",
    permissions: normalizePermissions(
      role,
      data.permissions ?? DEFAULT_ROLE_PERMISSIONS[role],
    ),
    passwordHash: await hashPassword(data.password),
    mustChangePassword: true,
  });
  return toPublicUser(user);
}

export async function updateTeamMember(id, data) {
  const user = await TeamMember.findById(id);
  if (!user) return null;
  if (data.permissions !== undefined && !Array.isArray(data.permissions)) {
    const error = new Error("Permissions must be a list.");
    error.status = 400;
    throw error;
  }
  const roleChanged = data.role !== undefined && data.role !== user.role;
  const nextRole = data.role || user.role;
  const nextStatus = data.status || user.status;
  if (
    user.role === "Owner" &&
    user.status === "Active" &&
    (nextRole !== "Owner" || nextStatus !== "Active") &&
    (await TeamMember.countDocuments({ role: "Owner", status: "Active" })) <= 1
  ) {
    const error = new Error("The last active Owner cannot be deactivated.");
    error.status = 409;
    throw error;
  }
  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.role !== undefined) user.role = nextRole;
  if (data.status !== undefined) user.status = nextStatus;
  if (data.permissions !== undefined || data.role !== undefined) {
    user.permissions = normalizePermissions(
      nextRole,
      data.permissions ??
        (roleChanged
          ? DEFAULT_ROLE_PERMISSIONS[nextRole]
          : user.permissions),
    );
  }
  if (data.password) {
    if (!validatePassword(data.password)) {
      const error = new Error("Password must be at least 10 characters.");
      error.status = 400;
      throw error;
    }
    user.passwordHash = await hashPassword(data.password);
    user.mustChangePassword = true;
  }
  await user.save();
  return toPublicUser(user);
}

export async function deleteTeamMember(id) {
  const user = await TeamMember.findById(id);
  if (!user) return null;
  if (
    user.role === "Owner" &&
    user.status === "Active" &&
    (await TeamMember.countDocuments({ role: "Owner", status: "Active" })) <= 1
  ) {
    const error = new Error("The last active Owner cannot be removed.");
    error.status = 409;
    throw error;
  }
  await user.deleteOne();
  return user;
}
