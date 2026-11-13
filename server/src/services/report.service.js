import Expense from "../models/Expense.model.js";
import Product from "../models/Product.model.js";
import Purchase from "../models/Purchase.model.js";
import Sale from "../models/Sale.model.js";
import Shift from "../models/Shift.model.js";

export async function getSalesReport(from) {
  const startDate = from
    ? new Date(from)
    : new Date(new Date().setDate(new Date().getDate() - 30));
  const sales = await Sale.find({ createdAt: { $gte: startDate } });
  return {
    total: sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    count: sales.length,
    sales,
  };
}

export async function getFinancialReport() {
  const [sales, expenses, products, purchases, shifts] = await Promise.all([
    Sale.find(),
    Expense.find(),
    Product.find(),
    Purchase.find(),
    Shift.find(),
  ]);
  const revenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const expenseTotal = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );
  const inventoryValue = products.reduce(
    (sum, product) => sum + (product.stock || 0) * (product.cost || 0),
    0,
  );
  return {
    revenue,
    expenses: expenseTotal,
    profit: revenue - expenseTotal,
    inventoryValue,
    purchases,
    shifts,
  };
}
