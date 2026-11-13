import { useState } from "react";
import { BarChart3, Download, Pencil, Trash2 } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

function Reports({ sales, expenses, customers, paymentMethods, perform }) {
  const [editor, setEditor] = useState(null);
  const availablePayments = paymentMethods.filter(
    (method) => method.status !== "Inactive",
  );

  const exportCsv = () => {
    const escapeCell = (value) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "Receipt",
        "Date",
        "Customer",
        "Payment method",
        "Subtotal",
        "Discount",
        "Total",
      ],
      ...sales.map((sale) => [
        sale.receiptNo,
        new Date(sale.createdAt).toLocaleDateString(),
        customers.find((customer) => customer._id === sale.customer)?.name ||
          "Walk-in customer",
        sale.paymentMethod || "Cash",
        sale.subtotal,
        sale.discount,
        sale.total,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "freshmart-sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
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

  const expenseTotal = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Sales reports</h3>
          <p>Review and update completed transactions and export reports.</p>
        </div>
        <button className="primary-btn" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      </section>
      <section className="report-summary">
        <article className="box report-metric">
          <span>Total recorded sales</span>
          <strong>
            $
            {sales
              .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
              .toFixed(2)}
          </strong>
        </article>
        <article className="box report-metric">
          <span>Transactions</span>
          <strong>{sales.length}</strong>
        </article>
        <article className="box report-metric">
          <span>Recorded expenses</span>
          <strong>${expenseTotal.toFixed(2)}</strong>
        </article>
      </section>
      <section className="box inventory-table-box">
        <div className="panel-title report-table-title">
          <div>
            <h3>Sales history</h3>
            <p>Edit payment details or void a sale.</p>
          </div>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.receiptNo}</td>
                  <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  <td>
                    {customers.find(
                      (customer) => customer._id === sale.customer,
                    )?.name || "Walk-in customer"}
                  </td>
                  <td>
                    {sale.items?.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ) || 0}
                  </td>
                  <td>{sale.paymentMethod || "Cash"}</td>
                  <td>${Number(sale.total || 0).toFixed(2)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        aria-label="Edit sale"
                        onClick={() =>
                          setEditor({
                            _id: sale._id,
                            paymentMethod: sale.paymentMethod || "Cash",
                            discount: String(sale.discount || 0),
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
                              () => api.sales.remove(sale._id),
                              "Sale voided and stock restored.",
                            );
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!sales.length && (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    <BarChart3 size={19} /> No sales have been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editor && (
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
