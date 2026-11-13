import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Wallet,
  Users,
  BarChart3,
  History,
  Settings,
} from "lucide-react";

export const P = [
  ["Milk 1L", 2.4, 46, "🥛"],
  ["Brown Bread", 1.8, 28, "🍞"],
  ["Orange Juice", 2.9, 31, "🧃"],
  ["Chocolate Cake", 9.5, 8, "🍰"],
  ["Red Apples", 3.2, 22, "🍎"],
  ["Potato Chips", 2.1, 4, "🥔"],
].map((x, i) => ({
  id: i + 1,
  name: x[0],
  price: x[1],
  stock: x[2],
  emoji: x[3],
  sku: `FM-00${i + 1}84`,
  batch: `BT-${2020 + i}`,
  expiry: "2026-12-20",
}));
export const C = [
  ["Sarah Wanjiku", "+254 712 332 100"],
  ["Mohamed Ali", "+254 701 456 889"],
  ["David Kamau", "+254 733 289 005"],
];
export const N = [
  ["Dashboard", LayoutDashboard],
  ["Sales", ShoppingCart],
  ["Inventory", Package],
  ["Purchases", Truck],
  ["Expenses", Wallet],
  ["Customers", Users],
  ["Reports", BarChart3],
  ["Audit log", History],
  ["Settings", Settings],
];
