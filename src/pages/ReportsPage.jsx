import { useState } from "react";
import { BarChart3, Download, Pencil, Trash2 } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const reportOptions = [
  ["overview", "Overview"],
  ["sales", "Sales history"],
  ["inventory", "Inventory"],
  ["expenses", "Expenses"],
  ["suppliers", "Suppliers & balances"],
  ["purchases", "Purchases"],
  ["products", "Top selling products"],
  ["returns", "Returns"],
];

function Reports({
  sales = [],
  expenses = [],
  products = [],
  suppliers = [],
  purchases = [],
  returns = [],
  paymentMethods = [],
  currency = "USD",
  perform,
  canManage = false,
}) {
  const [reportType, setReportType] = useState("overview");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editor, setEditor] = useState(null);
  const availablePayments = paymentMethods.filter(
    (method) => method.status !== "Inactive",
  );
  const money = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      Number(amount || 0),
    );
  const formatDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };
  const inDateRange = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return !from && !to;
    if (from && date < new Date(`${from}T00:00:00`)) return false;
    if (to && date > new Date(`${to}T23:59:59.999`)) return false;
    return true;
  };
  const filteredSales = sales.filter((sale) => inDateRange(sale.createdAt));
  const filteredExpenses = expenses.filter((expense) =>
    inDateRange(expense.expenseDate),
  );
  const activePurchases = purchases.filter(
    (purchase) => purchase.status !== "Cancelled",
  );
  const filteredPurchases = activePurchases.filter((purchase) =>
    inDateRange(purchase.createdAt),
  );
  const filteredReturns = returns.filter((record) =>
    inDateRange(record.createdAt),
  );
  const completedReturns = filteredReturns.filter(
    (record) => record.status === "Completed",
  );
  const salesTotal = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0,
  );
  const expensesTotal = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const inventoryCostValue = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0) * Number(product.cost || 0),
    0,
  );
  const inventoryRetailValue = products.reduce(
    (sum, product) =>
      sum + Number(product.stock || 0) * Number(product.price || 0),
    0,
  );
  const supplierTotals = suppliers.map((supplier) => {
    const records = activePurchases.filter(
      (purchase) =>
        String(purchase.supplier?._id || purchase.supplier || "") ===
        String(supplier._id),
    );
    const purchased = records.reduce(
      (sum, purchase) => sum + Number(purchase.total || 0),
      0,
    );
    const paid = records.reduce(
      (sum, purchase) => sum + Number(purchase.paidAmount || 0),
      0,
    );
    return {
      supplier,
      records,
      purchased,
      paid,
      due: Math.max(0, purchased - paid),
    };
  });
  const totalSupplierPurchases = supplierTotals.reduce(
    (sum, item) => sum + item.purchased,
    0,
  );
  const totalSupplierPaid = supplierTotals.reduce(
    (sum, item) => sum + item.paid,
    0,
  );
  const totalSupplierDue = supplierTotals.reduce(
    (sum, item) => sum + item.due,
    0,
  );
  const topProductsMap = new Map();
  for (const sale of filteredSales) {
    for (const item of sale.items || []) {
      const name = item.name || "Product";
      const product = topProductsMap.get(name) || { name, quantity: 0, sales: 0 };
      const quantity = Number(item.quantity || 0);
      product.quantity += quantity;
      product.sales += Number(item.price || 0) * quantity;
      topProductsMap.set(name, product);
    }
  }
  const topProducts = [...topProductsMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 20);
  const topUnits = topProducts.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const returnedUnits = completedReturns.reduce(
    (sum, record) =>
      sum +
      (record.items || []).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0,
      ),
    0,
  );
  const refunded = completedReturns.reduce(
    (sum, record) => sum + Number(record.refundAmount || 0),
    0,
  );
  const expenseCount = filteredExpenses.length;
  const table = (() => {
    switch (reportType) {
      case "sales":
        return {
          title: "Sales history",
          description: "Completed sales in the selected date range.",
          headers: [
            "Receipt",
            "Date",
            "Items",
            "Payment",
            "Subtotal",
            "Discount",
            "Total",
          ],
          rows: filteredSales.map((sale) => {
            return {
              key: sale._id,
              record: sale,
              cells: [
                sale.receiptNo || "—",
                formatDate(sale.createdAt),
                (sale.items || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0,
                ),
                sale.paymentMethod || "Cash",
                money(sale.subtotal),
                money(sale.discount),
                money(sale.total),
              ],
            };
          }),
        };
      case "inventory":
        return {
          title: "Inventory valuation",
          description: "Current stock, cost value, and potential retail value.",
          headers: [
            "Product",
            "SKU",
            "Category",
            "Stock",
            "Unit cost",
            "Unit price",
            "Stock cost value",
          ],
          rows: products.map((product) => ({
            key: product._id,
            cells: [
              product.name,
              product.sku || "—",
              product.category || "—",
              Number(product.stock || 0),
              money(product.cost),
              money(product.price),
              money(Number(product.stock || 0) * Number(product.cost || 0)),
            ],
          })),
        };
      case "expenses":
        return {
          title: "Expense report",
          description: "Recorded expenses in the selected date range.",
          headers: ["Date", "Category", "Description", "Payment method", "Amount"],
          rows: filteredExpenses.map((expense) => ({
            key: expense._id,
            cells: [
              formatDate(expense.expenseDate),
              expense.category || "—",
              expense.description || "—",
              expense.paymentMethod || "—",
              money(expense.amount),
            ],
          })),
        };
      case "suppliers":
        return {
          title: "Supplier balances",
          description: "Outstanding balances include all non-cancelled purchases.",
          headers: [
            "Supplier",
            "Contact",
            "Invoices",
            "Total purchases",
            "Paid",
            "Balance due",
          ],
          rows: supplierTotals.map(
            ({ supplier, records, purchased, paid, due }) => ({
              key: supplier._id,
              cells: [
                supplier.name,
                supplier.contact || "—",
                records.length,
                money(purchased),
                money(paid),
                { value: money(due), className: due > 0 ? "supplier-balance-due" : "" },
              ],
            }),
          ),
        };
      case "purchases":
        return {
          title: "Purchase report",
          description: "Supplier invoices in the selected date range.",
          headers: [
            "Invoice",
            "Date",
            "Supplier",
            "Products",
            "Status",
            "Total",
            "Paid",
            "Balance due",
          ],
          rows: filteredPurchases.map((purchase) => ({
            key: purchase._id,
            cells: [
              purchase.invoiceNo || purchase._id.slice(-8).toUpperCase(),
              formatDate(purchase.createdAt),
              purchase.supplier?.name || "—",
              purchase.items?.length || 0,
              purchase.status || "Draft",
              money(purchase.total),
              money(purchase.paidAmount),
              money(
                Math.max(
                  0,
                  Number(purchase.total || 0) - Number(purchase.paidAmount || 0),
                ),
              ),
            ],
          })),
        };
      case "products":
      case "overview":
        return {
          title: "Top selling products",
          description:
            "Products ranked by units sold in the selected date range.",
          headers: ["Rank", "Product", "Units sold", "Gross item sales"],
          rows: topProducts.map((product, index) => ({
            key: product.name,
            cells: [
              index + 1,
              product.name,
              product.quantity,
              money(product.sales),
            ],
          })),
        };
      case "returns":
        return {
          title: "Returns report",
          description: "Recorded returns in the selected date range.",
          headers: ["Date", "Invoice", "Products", "Units", "Status", "Refund"],
          rows: filteredReturns.map((record) => ({
            key: record._id,
            cells: [
              formatDate(record.createdAt),
              record.sale?.receiptNo ||
                record.sale?._id?.slice(-8).toUpperCase() ||
                "—",
              (record.items || [])
                .map(
                  (item) =>
                    item.product?.name ||
                    item.product?.sku ||
                    "Product",
                )
                .join(", "),
              (record.items || []).reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              ),
              record.status || "Completed",
              money(record.refundAmount),
            ],
          })),
        };
      default:
        return { title: "Report", description: "", headers: [], rows: [] };
    }
  })();
  const metrics = {
    overview: [
      ["Sales in range", money(salesTotal)],
      ["Expenses in range", money(expensesTotal)],
      ["Inventory at cost", money(inventoryCostValue)],
      ["Supplier balance due", money(totalSupplierDue)],
    ],
    sales: [
      ["Sales total", money(salesTotal)],
      ["Transactions", filteredSales.length],
      [
        "Average sale",
        money(filteredSales.length ? salesTotal / filteredSales.length : 0),
      ],
    ],
    inventory: [
      ["Products", products.length],
      [
        "Units in stock",
        products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      ],
      ["Stock at cost", money(inventoryCostValue)],
      ["Retail value", money(inventoryRetailValue)],
    ],
    expenses: [
      ["Total expenses", money(expensesTotal)],
      ["Expense entries", expenseCount],
      [
        "Average expense",
        money(expenseCount ? expensesTotal / expenseCount : 0),
      ],
    ],
    suppliers: [
      ["Suppliers", suppliers.length],
      ["Purchases", money(totalSupplierPurchases)],
      ["Paid", money(totalSupplierPaid)],
      ["Balance due", money(totalSupplierDue)],
    ],
    purchases: [
      ["Purchase orders", filteredPurchases.length],
      [
        "Total purchased",
        money(
          filteredPurchases.reduce(
            (sum, purchase) => sum + Number(purchase.total || 0),
            0,
          ),
        ),
      ],
      [
        "Balance due",
        money(
          filteredPurchases.reduce(
            (sum, purchase) =>
              sum +
              Math.max(
                0,
                Number(purchase.total || 0) -
                  Number(purchase.paidAmount || 0),
              ),
            0,
          ),
        ),
      ],
    ],
    products: [
      ["Products sold", topProducts.length],
      ["Units sold", topUnits],
      [
        "Gross item sales",
        money(topProducts.reduce((sum, product) => sum + product.sales, 0)),
      ],
    ],
    returns: [
      ["Return records", filteredReturns.length],
      ["Units returned", returnedUnits],
      ["Refunds", money(refunded)],
    ],
  }[reportType];

  const exportCsv = () => {
    const escapeCell = (value) =>
      `"${String(value ?? "")
        .replace(/^[=+\-@]/, (prefix) =>
          typeof value === "string" ? `'${prefix}` : prefix,
        )
        .replaceAll('"', '""')}"`;
    const exportHeaders =
      reportType === "overview" ? ["Metric", "Value"] : table.headers;
    const exportRows =
      reportType === "overview"
        ? metrics
        : table.rows.map((row) =>
            row.cells.map((cell) =>
              typeof cell === "object" ? cell.value : cell,
            ),
          );
    const csv = [exportHeaders, ...exportRows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `freshmart-${reportType}-report.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const saveSale = async (event) => {
    event.preventDefault();
    const result = await perform(
      () =>
        api.sales.update(editor._id, {
          paymentMethod: editor.paymentMethod,
          discount: Number(editor.discount || 0),
        }),
      "Sale updated.",
    );
    if (result) setEditor(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar reports-toolbar">
        <div>
          <h3>System reports</h3>
          <p>Explore and export sales, inventory, expenses, supplier balances, and more.</p>
        </div>
        <button className="primary-btn" onClick={exportCsv}>
          <Download size={16} /> Export {reportOptions.find(([key]) => key === reportType)?.[1]}
        </button>
      </section>
      <section className="box reports-filters">
        <label>
          Report type
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            {reportOptions.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        {(from || to) && (
          <button
            className="outline-btn"
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear dates
          </button>
        )}
      </section>
      <section className="report-summary">
        {metrics.map(([label, value]) => (
          <article className="box report-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="box inventory-table-box">
        <div className="panel-title report-table-title">
          <div>
            <h3>{table.title}</h3>
            <p>{table.description}</p>
          </div>
        </div>
        {table.rows.length ? (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  {table.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                  {reportType === "sales" && canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.key}>
                    {row.cells.map((cell, index) => (
                      <td
                        key={`${row.key}-${index}`}
                        className={
                          typeof cell === "object" ? cell.className : undefined
                        }
                      >
                        {typeof cell === "object" ? cell.value : cell}
                      </td>
                    ))}
                    {reportType === "sales" && canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            aria-label="Edit sale"
                            onClick={() =>
                              setEditor({
                                _id: row.record._id,
                                paymentMethod: row.record.paymentMethod || "Cash",
                                discount: String(row.record.discount || 0),
                              })
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-btn danger-icon"
                            aria-label="Void sale"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Void this sale and restore its stock?",
                                )
                              ) {
                                perform(
                                  () => api.sales.remove(row.record._id),
                                  "Sale voided and stock restored.",
                                );
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table-cell">
            <BarChart3 size={19} /> No records found for this report.
          </div>
        )}
      </section>
      {canManage && editor && (
        <Modal
          title="Edit sale"
          onClose={() => setEditor(null)}
          onSubmit={saveSale}
        >
          <div className="form-grid">
            <label>
              Payment method
              <select
                value={editor.paymentMethod}
                onChange={(event) =>
                  setEditor({ ...editor, paymentMethod: event.target.value })
                }
              >
                {availablePayments.length ? (
                  availablePayments.map((method) => (
                    <option key={method._id}>{method.name}</option>
                  ))
                ) : (
                  <>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>M-Pesa</option>
                  </>
                )}
              </select>
            </label>
            <label>
              Discount amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={editor.discount}
                onChange={(event) =>
                  setEditor({ ...editor, discount: event.target.value })
                }
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Reports;
