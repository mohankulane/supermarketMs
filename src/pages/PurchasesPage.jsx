import { useState } from "react";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankPurchase = () => ({
  supplier: "",
  invoiceNo: "",
  status: "Ordered",
  items: [{ product: "", quantity: "", cost: "" }],
});

function Purchases({ purchases, suppliers, products, perform }) {
  const [editor, setEditor] = useState(null);

  const openNew = () => {
    setEditor({ ...blankPurchase(), supplier: suppliers[0]?._id || "" });
  };

  const updateItem = (index, field, value) => {
    setEditor((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const savePurchase = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    const payload = {
      ...values,
      supplier: values.supplier || undefined,
      total: values.items.reduce(
        (sum, item) =>
          sum + Number(item.cost || 0) * Number(item.quantity || 0),
        0,
      ),
      items: values.items.map((item) => ({
        product: item.product?._id || item.product,
        quantity: Number(item.quantity),
        cost: Number(item.cost),
        batch: item.batch || "",
      })),
    };
    const result = await perform(
      () =>
        _id
          ? api.purchases.update(_id, payload)
          : api.purchases.create(payload),
      _id ? "Purchase updated." : "Purchase order created.",
    );
    if (result) setEditor(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Purchase orders</h3>
          <p>Track suppliers, invoices, and received inventory.</p>
        </div>
        <button className="primary-btn" onClick={openNew}>
          <Plus size={16} /> New purchase
        </button>
      </section>
      <section className="box inventory-table-box">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Purchase order</th>
                <th>Supplier</th>
                <th>Invoice</th>
                <th>Products</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase._id}>
                  <td>{purchase._id.slice(-8).toUpperCase()}</td>
                  <td>{purchase.supplier?.name || "No supplier"}</td>
                  <td>{purchase.invoiceNo || "—"}</td>
                  <td>{purchase.items?.length || 0} items</td>
                  <td>${Number(purchase.total || 0).toFixed(2)}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        purchase.status === "Received"
                          ? "status-active"
                          : purchase.status === "Cancelled"
                            ? "status-inactive"
                            : "status-warning"
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        aria-label="Edit purchase"
                        onClick={() =>
                          setEditor({
                            _id: purchase._id,
                            supplier: purchase.supplier?._id || "",
                            invoiceNo: purchase.invoiceNo || "",
                            status: purchase.status,
                            items: purchase.items?.length
                              ? purchase.items.map((item) => ({
                                  product:
                                    item.product?._id || item.product || "",
                                  quantity: String(item.quantity),
                                  cost: String(item.cost),
                                  batch: item.batch || "",
                                }))
                              : blankPurchase().items,
                          })
                        }
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn danger-icon"
                        aria-label="Delete purchase"
                        onClick={() => {
                          if (window.confirm("Delete this purchase order?")) {
                            perform(
                              () => api.purchases.remove(purchase._id),
                              "Purchase deleted.",
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
              {!purchases.length && (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    <Truck size={19} /> No purchase orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editor && (
        <Modal
          title={editor._id ? "Edit purchase order" : "Create purchase order"}
          onClose={() => setEditor(null)}
          onSubmit={savePurchase}
          submitLabel={editor._id ? "Save changes" : "Create order"}
        >
          <div className="form-grid">
            <label>
              Supplier
              <select
                required
                value={editor.supplier}
                onChange={(event) =>
                  setEditor({ ...editor, supplier: event.target.value })
                }
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option value={supplier._id} key={supplier._id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Supplier invoice
              <input
                value={editor.invoiceNo}
                onChange={(event) =>
                  setEditor({ ...editor, invoiceNo: event.target.value })
                }
              />
            </label>
            <label className="form-span-2">
              Order status
              <select
                value={editor.status}
                onChange={(event) =>
                  setEditor({ ...editor, status: event.target.value })
                }
              >
                <option>Draft</option>
                <option>Ordered</option>
                <option>Received</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>
          <div className="purchase-items-heading">
            <b>Purchased products</b>
            <button
              type="button"
              className="small-action"
              onClick={() =>
                setEditor({
                  ...editor,
                  items: [
                    ...editor.items,
                    { product: "", quantity: "", cost: "" },
                  ],
                })
              }
            >
              <Plus size={14} /> Add item
            </button>
          </div>
          <div className="purchase-item-list">
            {editor.items.map((item, index) => (
              <div className="purchase-item-row" key={index}>
                <label>
                  Product
                  <select
                    required
                    value={item.product}
                    onChange={(event) =>
                      updateItem(index, "product", event.target.value)
                    }
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    required
                    min="1"
                    type="number"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                  />
                </label>
                <label>
                  Unit cost
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={item.cost}
                    onChange={(event) =>
                      updateItem(index, "cost", event.target.value)
                    }
                  />
                </label>
                {editor.items.length > 1 && (
                  <button
                    type="button"
                    className="icon-btn danger-icon remove-purchase-item"
                    aria-label="Remove item"
                    onClick={() =>
                      setEditor({
                        ...editor,
                        items: editor.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Purchases;
