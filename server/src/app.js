import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { authenticate } from "./middleware/auth.middleware.js";
import productRoutes from "./routes/product.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import reportRoutes from "./routes/report.routes.js";
import returnRoutes from "./routes/return.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "8mb" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/products", authenticate, productRoutes);
app.use("/api/suppliers", authenticate, supplierRoutes);
app.use("/api/purchases", authenticate, purchaseRoutes);
app.use("/api/sales", authenticate, saleRoutes);
app.use("/api/expenses", authenticate, expenseRoutes);
app.use("/api/returns", authenticate, returnRoutes);
app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/audit-logs", authenticate, auditRoutes);
app.use("/api/backup", authenticate, backupRoutes);
app.use("/api/settings", authenticate, settingsRoutes);
app.use(errorMiddleware);

export default app;
