import { useState } from "react";
import TableHeader, { matchesQuery } from "../components/common/TableHeader.jsx";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankSupplier = { name: "", contact: "", email: "", status: "Active" };

function purchasePaid(purchase) {
  return Number(purchase.paidAmount || 0);
}

function purchaseDue(purchase) {
  return Math.max(0, Number(purchase.total || 0) - purchasePaid(purchase));
}

function Suppliers({
  suppliers,
  purchases = [],
  paymentMethods = [],
  currency = "USD",
  perform,
  canManage = false,
  canViewPurchases = false,
  canManagePurchases = false,
}) {
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const visibleSuppliers = suppliers.filter(
    (supplier) =>
      (statusFilter === "All" || supplier.status === statusFilter) &&
      matchesQuery(query, supplier.name, supplier.contact, supplier.email),
  );
  const [paymentEditor, setPaymentEditor] = useState(null);
  const money = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      Number(amount || 0),
    );
  const payments = paymentMethods.filter((method) => method.status !== "Inactive");
  const methods = payments.length
    ? payments
    : [{ _id: "cash", name: "Cash" }, { _id: "bank", name: "Bank Transfer" }];

  const supplierPurchases = (supplierId) =>
    purchases.filter(
      (purchase) =>
        String(purchase.supplier?._id || purchase.supplier || "") ===
          String(supplierId) &&
        purchase.status !== "Cancelled",
    );

  const supplierBalance = (supplierId) => {
    const records = supplierPurchases(supplierId);
    return records.reduce(
      (totals, purchase) => ({
        purchased: totals.purchased + Number(purchase.total || 0),
        paid: totals.paid + purchasePaid(purchase),
        due: totals.due + purchaseDue(purchase),
      }),
      { purchased: 0, paid: 0, due: 0 },
    );
  };

  const openPayment = (supplier) => {
    const outstanding = supplierPurchases(supplier._id).filter(
      (purchase) => purchaseDue(purchase) > 0.001,
    );
    if (!outstanding.length) return;
    setPaymentEditor({
      supplier,
      purchaseId: outstanding[0]._id,
      amount: String(purchaseDue(outstanding[0])),
      method: methods[0].name,
      note: "",
    });
  };

  const savePayment = async (event) => {
    event.preventDefault();
    const purchase = supplierPurchases(paymentEditor.supplier._id).find(
      (record) => record._id === paymentEditor.purchaseId,
    );
    const amount = Number(paymentEditor.amount);
    if (!purchase || !Number.isFinite(amount) || amount <= 0) return;
    const result = await perform(
      () =>
        api.payPurchase(purchase._id, {
          amount,
          method: paymentEditor.method,
          note: paymentEditor.note,
        }),
      "Supplier payment recorded.",
    );
    if (result) setPaymentEditor(null);
  };

  const saveSupplier = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    const result = await perform(
      () =>
        _id ? api.suppliers.update(_id, values) : api.suppliers.create(values),
      _id ? "Supplier updated." : "Supplier added.",
    );
    if (result) setEditor(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Suppliers</h3>
          <p>Maintain supplier contacts used to create purchase orders.</p>
        </div>
        {canManage && (
          <button
            className="primary-btn"
            onClick={() => setEditor({ ...blankSupplier })}
          >
            <Plus size={16} /> Add supplier
          </button>
        )}
      </section>
      <section className="box inventory-table-box">
        <TableHeader
          title="Suppliers"
          icon={Truck}
          count={visibleSuppliers.length}
          total={suppliers.length}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search suppliers..."
          filter={{
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [["All", "All statuses"], "Active", "Inactive"],
          }}
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Total purchases</th>
                <th>Paid</th>
                <th>Balance due</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleSuppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact || "—"}</td>
                  <td>{supplier.email || "—"}</td>
                  {(() => {
                    const balance = supplierBalance(supplier._id);
                    return (
                      <>
                        <td>{canViewPurchases ? money(balance.purchased) : "—"}</td>
                        <td>{canViewPurchases ? money(balance.paid) : "—"}</td>
                        <td
                          className={
                            canViewPurchases && balance.due > 0
                              ? "supplier-balance-due"
                              : ""
                          }
                        >
                          {canViewPurchases ? money(balance.due) : "—"}
                        </td>
                      </>
                    );
                  })()}
                  <td>
                    <span
                      className={`status-pill ${supplier.status === "Active" ? "status-active" : "status-inactive"}`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        {canManagePurchases &&
                          canViewPurchases &&
                          supplierBalance(supplier._id).due > 0.001 && (
                            <button
                              className="small-action"
                              onClick={() => openPayment(supplier)}
                            >
                              Pay supplier
                            </button>
                          )}
                        <button
                          className="icon-btn"
                          aria-label="Edit supplier"
                          onClick={() =>
                            setEditor({ ...blankSupplier, ...supplier })
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          aria-label="Delete supplier"
                          onClick={() => {
                            if (window.confirm(`Delete ${supplier.name}?`)) {
                              perform(
                                () => api.suppliers.remove(supplier._id),
                                "Supplier deleted.",
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
              {!visibleSuppliers.length && (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="empty-table-cell">
                    <Truck size={19} /> No suppliers have been added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editor && (
        <Modal
          title={editor._id ? "Edit supplier" : "Add supplier"}
          onClose={() => setEditor(null)}
          onSubmit={saveSupplier}
        >
          <div className="form-grid">
            <label>
              Supplier name
              <input
                autoFocus
                required
                value={editor.name}
                onChange={(event) =>
                  setEditor({ ...editor, name: event.target.value })
                }
              />
            </label>
            <label>
              Contact number
              <input
                value={editor.contact}
                onChange={(event) =>
                  setEditor({ ...editor, contact: event.target.value })
                }
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={editor.email}
                onChange={(event) =>
                  setEditor({ ...editor, email: event.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={editor.status}
                onChange={(event) =>
                  setEditor({ ...editor, status: event.target.value })
                }
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
        </Modal>
      )}
      {paymentEditor && (
        <Modal
          title={`Pay ${paymentEditor.supplier.name}`}
          onClose={() => setPaymentEditor(null)}
          onSubmit={savePayment}
          submitLabel="Record payment"
        >
          <div className="form-grid">
            <label className="form-span-2">
              Purchase invoice
              <select
                required
                value={paymentEditor.purchaseId}
                onChange={(event) => {
                  const purchase = supplierPurchases(
                    paymentEditor.supplier._id,
                  ).find((record) => record._id === event.target.value);
                  if (purchase) {
                    setPaymentEditor({
                      ...paymentEditor,
                      purchaseId: purchase._id,
                      amount: String(purchaseDue(purchase)),
                    });
                  }
                }}
              >
                {supplierPurchases(paymentEditor.supplier._id)
                  .filter((purchase) => purchaseDue(purchase) > 0.001)
                  .map((purchase) => (
                    <option key={purchase._id} value={purchase._id}>
                      {purchase.invoiceNo ||
                        purchase._id.slice(-8).toUpperCase()}{" "}
                      — {money(purchaseDue(purchase))} due
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Amount paid
              <input
                required
                min="0.01"
                max={purchaseDue(
                  supplierPurchases(paymentEditor.supplier._id).find(
                    (purchase) => purchase._id === paymentEditor.purchaseId,
                  ) || {},
                )}
                step="0.01"
                type="number"
                value={paymentEditor.amount}
                onChange={(event) =>
                  setPaymentEditor({
                    ...paymentEditor,
                    amount: event.target.value,
                  })
                }
              />
              <small>
                Balance due:{" "}
                {money(
                  purchaseDue(
                    supplierPurchases(paymentEditor.supplier._id).find(
                      (purchase) => purchase._id === paymentEditor.purchaseId,
                    ) || {},
                  ),
                )}
              </small>
            </label>
            <label>
              Payment method
              <select
                value={paymentEditor.method}
                onChange={(event) =>
                  setPaymentEditor({
                    ...paymentEditor,
                    method: event.target.value,
                  })
                }
              >
                {methods.map((method) => (
                  <option key={method._id || method.name}>{method.name}</option>
                ))}
              </select>
            </label>
            <label className="form-span-2">
              Reference / note (optional)
              <input
                value={paymentEditor.note}
                onChange={(event) =>
                  setPaymentEditor({
                    ...paymentEditor,
                    note: event.target.value,
                  })
                }
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Suppliers;
