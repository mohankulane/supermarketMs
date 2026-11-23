import Customer from "../models/Customer.model.js";
import Expense from "../models/Expense.model.js";
import Product from "../models/Product.model.js";
import Sale from "../models/Sale.model.js";
import Supplier from "../models/Supplier.model.js";

export async function getDashboard() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [products, suppliers, customers, salesData, expenseData, recentSales] =
    await Promise.all([
      Product.find().sort({ stock: 1 }),
      Supplier.countDocuments({ status: "Active" }),
      Customer.countDocuments(),
      Sale.aggregate([
        {
          $facet: {
            metrics: [
              {
                $group: {
                  _id: null,
                  lifetimeRevenue: { $sum: { $ifNull: ["$total", 0] } },
                  lifetimeOrders: { $sum: 1 },
                  monthRevenue: {
                    $sum: {
                      $cond: [
                        { $gte: ["$createdAt", monthStart] },
                        { $ifNull: ["$total", 0] },
                        0,
                      ],
                    },
                  },
                  monthOrders: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", monthStart] }, 1, 0],
                    },
                  },
                  yearRevenue: {
                    $sum: {
                      $cond: [
                        { $gte: ["$createdAt", yearStart] },
                        { $ifNull: ["$total", 0] },
                        0,
                      ],
                    },
                  },
                  yearOrders: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", yearStart] }, 1, 0],
                    },
                  },
                  todayRevenue: {
                    $sum: {
                      $cond: [
                        { $gte: ["$createdAt", today] },
                        { $ifNull: ["$total", 0] },
                        0,
                      ],
                    },
                  },
                  todayOrders: {
                    $sum: {
                      $cond: [{ $gte: ["$createdAt", today] }, 1, 0],
                    },
                  },
                },
              },
            ],
            monthlyTrend: [
              { $match: { createdAt: { $gte: trendStart } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m", date: "$createdAt" },
                  },
                  total: { $sum: { $ifNull: ["$total", 0] } },
                  orders: { $sum: 1 },
                },
              },
            ],
            topProducts: [
              { $match: { createdAt: { $gte: monthStart } } },
              { $unwind: "$items" },
              {
                $group: {
                  _id: { $ifNull: ["$items.name", "Product"] },
                  quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
                },
              },
              { $sort: { quantity: -1, _id: 1 } },
              { $limit: 5 },
            ],
          },
        },
      ]),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$amount", 0] } },
            count: { $sum: 1 },
          },
        },
      ]),
      Sale.find().sort({ createdAt: -1 }).limit(8),
    ]);

  const monthMap = new Map(
    (salesData[0]?.monthlyTrend || []).map((month) => [month._id, month]),
  );
  const chart = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = monthMap.get(key);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      total: month?.total || 0,
      orders: month?.orders || 0,
    };
  });

  const metrics = salesData[0]?.metrics?.[0] || {};
  const monthExpenses = expenseData[0] || { total: 0, count: 0 };
  const lowStock = products.filter(
    (product) => product.stock <= product.reorderLevel,
  );

  return {
    revenue: metrics.todayRevenue || 0,
    expenses: monthExpenses.total,
    profit: (metrics.monthRevenue || 0) - monthExpenses.total,
    orders: metrics.todayOrders || 0,
    products: products.length,
    suppliers,
    customers,
    summary: {
      monthRevenue: metrics.monthRevenue || 0,
      monthOrders: metrics.monthOrders || 0,
      yearRevenue: metrics.yearRevenue || 0,
      yearOrders: metrics.yearOrders || 0,
      lifetimeRevenue: metrics.lifetimeRevenue || 0,
      lifetimeOrders: metrics.lifetimeOrders || 0,
      monthExpenses: monthExpenses.total,
      monthExpenseCount: monthExpenses.count,
    },
    lowStock,
    recentSales,
    chart,
    topProducts: salesData[0]?.topProducts || [],
  };
}
