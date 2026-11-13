import asyncHandler from "../middleware/asyncHandler.js";
import * as customers from "../services/customer.service.js";

export const getCustomers = asyncHandler(async (_req, res) =>
  res.json(await customers.findCustomers()),
);

export const createCustomer = asyncHandler(async (req, res) =>
  res.status(201).json(await customers.createCustomer(req.body)),
);

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customers.updateCustomer(req.params.id, req.body);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await customers.deleteCustomer(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.status(204).end();
});
