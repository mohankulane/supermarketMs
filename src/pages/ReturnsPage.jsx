import { useEffect, useMemo, useState } from "react";
import TableHeader, { matchesQuery } from "../components/common/TableHeader.jsx";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

function refundValue(sale, productId, quantity) {
  if (!sale) return "";
  const items = sale.items.filter(
    (item) => String(item.product) === String(productId),
  );
  const subtotal =
    Number(sale.subtotal) ||
    sale.items.reduce(
      (sum, item) =>
        sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
  const total = Number(sale.total ?? subtotal - Number(sale.discount || 0));
  const factor = subtotal > 0 ? Math.min(1, Math.max(0, total / subtotal)) : 1;
  const gross = items.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const soldQuantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  return soldQuantity
    ? ((gross / soldQuantity) * Number(quantity) * factor).toFixed(2)
    : "";
}

function Returns({
  returns,
  products,
  sales,
  perform,
  returnTarget,
  clearReturnTarget,
  canManage = false,
}) {
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const returnStatuses = [
    "All",
    ...new Set(returns.map((record) => record.status).filter(Boolean)),
  ];
  const visibleReturns = returns.filter(
    (record) =>
      (statusFilter === "All" || record.status === statusFilter) &&
      matchesQuery(
        query,
        record._id,
        record.sale?.receiptNo,
        ...(record.items || []).map((item) => item.product?.name),
      ),
  );

  const remainingFor = (saleId, productId, exceptReturnId) => {
    const sale = sales.find((record) => record._id === saleId);
    if (!sale) return 0;
    const sold = sale.items
      .filter((item) => String(item.product) === String(productId))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const returned = returns
      .filter(
        (record) =>
          record.status === "Completed" &&
          String(record.sale?._id || record.sale || "") === String(saleId) &&
          String(record._id) !== String(exceptReturnId || ""),
      )
      .flatMap((record) => record.items || [])
      .filter(
        (item) =>
          String(item.product?._id || item.product) === String(productId),
      )
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return Math.max(0, sold - returned);
  };

  const remainingSaleItems = (sale, exceptReturnId) =>
    (sale?.items || []).filter(
      (item) =>
        remainingFor(sale._id, item.product, exceptReturnId) > 0 ||
        String(item.product) === String(editor?.items?.[0]?.product),
    );

  const returnFromSale = (sale) => {
    const item = sale.items.find(
      (saleItem) => remainingFor(sale._id, saleItem.product) > 0,
    );
    if (!item) return;
    setEditor({
      sale: sale._id,
      items: [
        {
          product: item.product,
          quantity: 1,
          reason: "",
        },
      ],
      refundAmount: refundValue(sale, item.product, 1),
      status: "Completed",
    });
  };

  useEffect(() => {
    if (!returnTarget) return;
    if (canManage) returnFromSale(returnTarget);
    clearReturnTarget();
  }, [returnTarget?._id, canManage]);

  const newReturn = () => ({
    sale: "",
    items: [{ product: products[0]?._id || "", quantity: 1, reason: "" }],
    refundAmount: "",
    status: "Completed",
  });

  const selectedSale = useMemo(
    () => sales.find((sale) => sale._id === editor?.sale),
    [editor?.sale, sales],
  );
  const saleItems = selectedSale
    ? remainingSaleItems(selectedSale, editor?._id)
    : [];
  const selectedItem = selectedSale?.items.find(
    (item) =>
      String(item.product) === String(editor?.items?.[0]?.product),
  );
  const maxQuantity = selectedSale
    ? remainingFor(
        selectedSale._id,
        editor?.items?.[0]?.product,
        editor?._id,
      )
    : undefined;

  const saveReturn = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    const payload = {
      ...values,
      sale: values.sale || undefined,
      refundAmount: Number(values.refundAmount || 0),
      items: values.items.map((item) => ({
        product: item.product?._id || item.product,
        quantity: Number(item.quantity),
        reason: item.reason,
      })),
    };
    const result = await perform(
      () =>
        _id ? api.returns.update(_id, payload) : api.returns.create(payload),
      _id ? "Return updated." : "Return processed and stock restored.",
    );
    if (result) setEditor(null);
  };

  const setProduct = (productId) => {
    const item = selectedSale?.items.find(
      (saleItem) => String(saleItem.product) === String(productId),
    );
    const quantity = selectedSale
      ? Math.max(
          1,
          Math.min(
            Number(editor.items[0]?.quantity || 1),
            remainingFor(selectedSale._id, productId, editor._id),
          ),
        )
      : Number(editor.items[0]?.quantity || 1);
    setEditor({
      ...editor,
      items: [{ ...editor.items[0], product: productId, quantity }],
      refundAmount: item && selectedSale
        ? refundValue(selectedSale, productId, quantity)
        : editor.refundAmount,
    });
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Returns and refunds</h3>
          <p>Link returns to invoices to prevent returning more than purchased.</p>
        </div>
        {canManage && (
          <button
            className="primary-btn"
            disabled={!products.length}
            onClick={() => setEditor(newReturn())}
          >
            <Plus size={16} /> Process return
          </button>
        )}
      </section>
      <section className="box inventory-table-box">
        <TableHeader
          title="Returns"
          icon={RotateCcw}
          count={visibleReturns.length}
          total={returns.length}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search returns..."
          filter={{
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: returnStatuses.map((item) => [item, item === "All" ? "All statuses" : item]),
          }}
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Invoice</th>
                <th>Products</th>
                <th>Refund</th>
                <th>Status</th>
                <th>Date</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleReturns.map((record) => (
                <tr key={record._id}>
                  <td>{record._id.slice(-8).toUpperCase()}</td>
                  <td>
                    {record.sale?.receiptNo ||
                      (record.sale?._id || record.sale
                        ? String(record.sale?._id || record.sale).slice(-8)
                        : "—")}
                  </td>
                  <td>
                    {record.items
                      ?.map(
                        (item) =>
                          `${item.product?.name || "Product"} × ${item.quantity}`,
                      )
                      .join(", ") || "—"}
                  </td>
                  <td>${Number(record.refundAmount || 0).toFixed(2)}</td>
                  <td>
                    <span className="status-pill status-active">
                      {record.status}
                    </span>
                  </td>
                  <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          aria-label="Edit return"
                          onClick={() =>
                            setEditor({
                              _id: record._id,
                              sale: record.sale?._id || record.sale || "",
                              status: record.status,
                              refundAmount: String(record.refundAmount || 0),
                              items: record.items.map((item) => ({
                                product: item.product?._id || item.product,
                                quantity: item.quantity,
                                reason: item.reason || "",
                              })),
                            })
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          aria-label="Delete return"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Delete this return and reverse its stock adjustment?",
                              )
                            ) {
                              perform(
                                () => api.returns.remove(record._id),
                                "Return deleted and stock adjustment reversed.",
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
              {!visibleReturns.length && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="empty-table-cell">
                    <RotateCcw size={19} /> No returns have been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editor && (
        <Modal
          title={editor._id ? "Edit return" : "Process return"}
          onClose={() => setEditor(null)}
          onSubmit={saveReturn}
          submitLabel={editor._id ? "Save changes" : "Process refund"}
        >
          <div className="form-grid">
            <label className="form-span-2">
              Invoice
              <select
                value={editor.sale}
                onChange={(event) => {
                  const sale = sales.find(
                    (record) => record._id === event.target.value,
                  );
                  if (sale) {
                    returnFromSale(sale);
                  } else {
                    setEditor({
                      ...editor,
                      sale: "",
                      items: [
                        {
                          ...editor.items[0],
                          product: products[0]?._id || "",
                          quantity: 1,
                        },
                      ],
                      refundAmount: "",
                    });
                  }
                }}
              >
                <option value="">Manual return (no invoice)</option>
                {sales.map((sale) => (
                  <option value={sale._id} key={sale._id}>
                    {sale.receiptNo} ·{" "}
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Product
              <select
                required
                value={editor.items[0]?.product || ""}
                onChange={(event) => setProduct(event.target.value)}
              >
                {(selectedSale ? saleItems : products).map((product) => {
                  const productId = product.product || product._id;
                  const productName =
                    product.name ||
                    products.find((entry) => entry._id === productId)?.name ||
                    "Product";
                  return (
                    <option value={productId} key={productId}>
                      {productName}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              Quantity
              <input
                required
                min="1"
                max={selectedSale ? maxQuantity : undefined}
                type="number"
                value={editor.items[0]?.quantity || ""}
                onChange={(event) => {
                  const quantity = Math.min(
                    Number(event.target.value || 1),
                    selectedSale ? maxQuantity : Infinity,
                  );
                  setEditor({
                    ...editor,
                    items: [{ ...editor.items[0], quantity }],
                    refundAmount: selectedItem && selectedSale
                      ? refundValue(selectedSale, selectedItem.product, quantity)
                      : editor.refundAmount,
                  });
                }}
              />
              {selectedSale && <small>{maxQuantity} remaining on invoice</small>}
            </label>
            <label>
              Refund amount
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={editor.refundAmount}
                onChange={(event) =>
                  setEditor({ ...editor, refundAmount: event.target.value })
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
                <option>Completed</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
            </label>
            <label className="form-span-2">
              Reason
              <input
                value={editor.items[0]?.reason || ""}
                onChange={(event) =>
                  setEditor({
                    ...editor,
                    items: [{ ...editor.items[0], reason: event.target.value }],
                  })
                }
              />
            </label>
          </div>
          <p className="form-hint">
            <RotateCcw size={14} /> Stock is adjusted when the return is saved.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default Returns;
