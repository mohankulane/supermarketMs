import Customer from "../models/Customer.model.js";
import Sale from "../models/Sale.model.js";

export const findCustomers = () => Customer.find().sort({ createdAt: -1 });
export const createCustomer = (data) => Customer.create(data);
export const updateCustomer = (id, data) =>
  Customer.findByIdAndUpdate(id, data, { new: true, runValidators: true });
export async function deleteCustomer(id) {
  const customer = await Customer.findById(id);
  if (!customer) return null;
  if (await Sale.exists({ customer: id })) {
    const error = new Error(
      "This customer has sales history and cannot be deleted.",
    );
    error.status = 409;
    throw error;
  }
  await customer.deleteOne();
  return customer;
}
