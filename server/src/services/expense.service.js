import Audit from "../models/Audit.model.js";
import Expense from "../models/Expense.model.js";

export const findExpenses = () => Expense.find().sort({ expenseDate: -1 });

export async function createExpense(data) {
  const expense = await Expense.create(data);
  await Audit.create({
    actor: data.user || "System",
    action: "Created expense",
    entity: "Expense",
    entityId: expense._id,
    details: expense.category,
  });
  return expense;
}

export const updateExpense = (id, data) =>
  Expense.findByIdAndUpdate(id, data, { new: true, runValidators: true });

export const deleteExpense = (id) => Expense.findByIdAndDelete(id);
