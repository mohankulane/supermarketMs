import asyncHandler from "../middleware/asyncHandler.js";
import * as expenses from "../services/expense.service.js";

export const getExpenses = asyncHandler(async (_req, res) =>
  res.json(await expenses.findExpenses()),
);

export const createExpense = asyncHandler(async (req, res) =>
  res.status(201).json(await expenses.createExpense(req.body)),
);

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenses.updateExpense(req.params.id, req.body);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  res.json(expense);
});

export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await expenses.deleteExpense(req.params.id);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  res.status(204).end();
});
