import cors from "cors";
import express from "express";
import auditRoutes from "./routes/audit.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import productRoutes from "./routes/product.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import reportRoutes from "./routes/report.routes.js";
import returnRoutes from "./routes/return.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use("/api/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/settings", settingsRoutes);
app.use(errorMiddleware);

export default app;
