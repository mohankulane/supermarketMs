import Supplier from "../models/Supplier.model.js";
import Purchase from "../models/Purchase.model.js";

export const findSuppliers = () => Supplier.find().sort({ name: 1 });
export const createSupplier = (data) => Supplier.create(data);
export const updateSupplier = (id, data) =>
  Supplier.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export async function deleteSupplier(id) {
  const supplier = await Supplier.findById(id);
  if (!supplier) return null;
  if (await Purchase.exists({ supplier: id })) {
    const error = new Error(
      "This supplier has purchase history and cannot be deleted.",
    );
    error.status = 409;
    throw error;
  }
  await supplier.deleteOne();
  return supplier;
}
