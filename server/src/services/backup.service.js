import Audit from "../models/Audit.model.js";
import Customer from "../models/Customer.model.js";
import Expense from "../models/Expense.model.js";
import Product from "../models/Product.model.js";
import Purchase from "../models/Purchase.model.js";
import Sale from "../models/Sale.model.js";
import Supplier from "../models/Supplier.model.js";

export async function createBackup() {
  const [products, suppliers, customers, sales, expenses, purchases] =
    await Promise.all([
      Product.find(),
      Supplier.find(),
      Customer.find(),
      Sale.find(),
      Expense.find(),
      Purchase.find(),
    ]);
  return {
    createdAt: new Date(),
    products,
    suppliers,
    customers,
    sales,
    expenses,
    purchases,
  };
}

export async function restoreBackup(data) {
  await Product.deleteMany({});
  await Product.insertMany(data.products.map(({ _id, __v, ...item }) => item));
  await Audit.create({
    actor: "Owner",
    action: "Restored backup",
    entity: "System",
    details: `Restored ${data.products.length} products`,
  });
  return { restored: data.products.length };
}
