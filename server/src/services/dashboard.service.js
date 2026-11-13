import Expense from "../models/Expense.model.js";
import Product from "../models/Product.model.js";
import Sale from "../models/Sale.model.js";
import Supplier from "../models/Supplier.model.js";

export async function getDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const [products, suppliers, todaySales, expenses, recentSales, weekSales] =
    await Promise.all([
      Product.find().sort({ stock: 1 }),
      Supplier.countDocuments({ status: "Active" }),
      Sale.find({ createdAt: { $gte: today } }),
      Expense.find({ expenseDate: { $gte: today } }),
      Sale.find().sort({ createdAt: -1 }).limit(8),
      Sale.find({ createdAt: { $gte: weekStart } }),
    ]);

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const daySales = weekSales.filter(
      (sale) => new Date(sale.createdAt).toDateString() === date.toDateString(),
    );
    return {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
      total: daySales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    };
  });

  const productTotals = new Map();
  for (const sale of weekSales) {
    for (const item of sale.items) {
      const name = item.name || "Product";
      productTotals.set(
        name,
        (productTotals.get(name) || 0) + Number(item.quantity || 0),
      );
    }
  }
  const topProducts = [...productTotals]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const revenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const expenseTotal = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );

  return {
    revenue,
    expenses: expenseTotal,
    profit: revenue - expenseTotal,
    orders: todaySales.length,
    products: products.length,
    lowStock: products.filter(
      (product) => product.stock <= product.reorderLevel,
    ),
    suppliers,
    recentSales,
    chart,
    topProducts,
  };
}
