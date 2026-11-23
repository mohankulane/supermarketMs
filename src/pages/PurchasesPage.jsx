import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Plus, Pencil, Trash2, Truck } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";
import TableHeader, { matchesQuery } from "../components/common/TableHeader.jsx";

const blankPurchase = () => ({
  supplier: "",
  invoiceNo: "",
  status: "Ordered",
  paidAmount: "",
  paymentMethod: "Cash",
  items: [{ product: "", quantity: "", cost: "" }],
});

const blankProduct = () => ({
  name: "",
  category: "",
  sku: "",
  price: "",
  cost: "",
});

function Purchases({
  purchases,
  suppliers,
  products,
  paymentMethods = [],
  currency = "USD",
  perform,
  canManage = false,
  canManageInventory = false,
}) {
  const [editor, setEditor] = useState(null);
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [productEditorIndex, setProductEditorIndex] = useState(0);
  const [newProduct, setNewProduct] = useState(blankProduct);
  const [productError, setProductError] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const visiblePurchases = purchases.filter(
    (purchase) =>
      (statusFilter === "All" || purchase.status === statusFilter) &&
      matchesQuery(query, purchase._id, purchase.supplier?.name, purchase.invoiceNo),
  );
  const activePaymentMethods = paymentMethods.filter(
    (method) => method.status !== "Inactive",
  );
  const availablePaymentMethods = activePaymentMethods.length
    ? activePaymentMethods
    : [{ _id: "cash", name: "Cash" }];
  const money = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      Number(amount || 0),
    );

  const supplierGroups = useMemo(() => {
    const groups = new Map();
    visiblePurchases.forEach((purchase) => {
      const key = purchase.supplier?._id || "none";
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          name: purchase.supplier?.name || "No supplier",
          purchases: [],
          total: 0,
          paid: 0,
          due: 0,
        });
      }
      const group = groups.get(key);
      const paid = Number(purchase.paidAmount || 0);
      group.purchases.push(purchase);
      if (purchase.status !== "Cancelled") {
        group.total += Number(purchase.total || 0);
        group.paid += paid;
        group.due += Math.max(0, Number(purchase.total || 0) - paid);
      }
    });
    return [...groups.values()].sort((a, b) =>
      a.key === "none" ? 1 : b.key === "none" ? -1 : a.name.localeCompare(b.name),
    );
  }, [visiblePurchases]);

  const toggleGroup = (key) =>
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const columnCount = canManage ? 8 : 7;

  const openNew = () => {
    setProductEditorOpen(false);
    setEditor({
      ...blankPurchase(),
      supplier: suppliers[0]?._id || "",
      paymentMethod:
        availablePaymentMethods.find((method) => method.isDefault)?.name ||
        availablePaymentMethods[0].name,
    });
  };

  const openProductEditor = (index) => {
    setProductEditorIndex(index);
    setNewProduct({
      ...blankProduct(),
      cost: editor.items[index]?.cost || "",
    });
    setProductError("");
    setProductEditorOpen(true);
  };

  const createProduct = async () => {
    const price = Number(newProduct.price);
    const cost = Number(newProduct.cost || 0);
    if (!newProduct.name.trim() || !newProduct.category.trim()) {
      setProductError("Enter a product name and category.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setProductError("Enter a selling price greater than zero.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      setProductError("Enter a valid purchase cost.");
      return;
    }
    const product = await perform(
      () =>
        api.products.create({
          name: newProduct.name.trim(),
          category: newProduct.category.trim(),
          ...(newProduct.sku.trim() ? { sku: newProduct.sku.trim() } : {}),
          price,
          cost,
          stock: 0,
          reorderLevel: 10,
          unit: "Each",
        }),
      "Product added to the catalog.",
    );
    if (!product) return;
    setEditor((current) => ({
      ...current,
      items: current.items.map((item, index) =>
        index === productEditorIndex
          ? {
              ...item,
              product: product._id,
              cost: item.cost || String(product.cost || 0),
            }
          : item,
      ),
    }));
    setProductEditorOpen(false);
    setProductError("");
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
    const total = Math.round(
      values.items.reduce(
        (sum, item) =>
          sum + Number(item.cost || 0) * Number(item.quantity || 0),
        0,
      ) * 100,
    ) / 100;
    const payload = {
      ...values,
      supplier: values.supplier || undefined,
      total,
      ...(_id
        ? {}
        : {
            paidAmount: Number(values.paidAmount || 0),
            paymentMethod: values.paymentMethod || "Cash",
          }),
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
        {canManage && (
          <button className="primary-btn" onClick={openNew}>
            <Plus size={16} /> New purchase
          </button>
        )}
      </section>
      <section className="box inventory-table-box">
        <TableHeader
          title="Purchase orders"
          icon={Truck}
          count={visiblePurchases.length}
          total={purchases.length}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search supplier, invoice or order..."
          filter={{
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [["All", "All statuses"], "Draft", "Ordered", "Received", "Cancelled"],
          }}
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Purchase order</th>
                <th>Invoice</th>
                <th>Products</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance due</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {supplierGroups.map((group) => {
                const collapsed = collapsedGroups.has(group.key);
                return [
                  <tr className="purchase-group-row" key={`group-${group.key}`}>
                    <td colSpan={columnCount}>
                      <button
                        type="button"
                        className="purchase-group-toggle"
                        aria-expanded={!collapsed}
                        onClick={() => toggleGroup(group.key)}
                      >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        <span className="purchase-group-icon">
                          <Building2 size={15} />
                        </span>
                        <span className="purchase-group-name">
                          <b>{group.name}</b>
                          <small>
                            {group.purchases.length}{" "}
                            {group.purchases.length === 1 ? "order" : "orders"}
                          </small>
                        </span>
                        <span className="purchase-group-stats">
                          <span>
                            Total <b>{money(group.total)}</b>
                          </span>
                          <span>
                            Paid <b>{money(group.paid)}</b>
                          </span>
                          <span className={group.due > 0 ? "supplier-balance-due" : ""}>
                            Balance <b>{money(group.due)}</b>
                          </span>
                        </span>
                      </button>
                    </td>
                  </tr>,
                  ...(collapsed ? [] : group.purchases.map((purchase) => {
                const paid = Number(purchase.paidAmount || 0);
                const due = Math.max(0, Number(purchase.total || 0) - paid);
                return (
                  <tr className="purchase-group-item" key={purchase._id}>
                    <td>{purchase._id.slice(-8).toUpperCase()}</td>
                    <td>{purchase.invoiceNo || "—"}</td>
                    <td>{purchase.items?.length || 0} items</td>
                    <td>{money(purchase.total)}</td>
                    <td>{money(paid)}</td>
                    <td className={due > 0 ? "supplier-balance-due" : ""}>
                      {money(due)}
                    </td>
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
                      {purchase.status !== "Cancelled" && (
                        <small className="purchase-payment-status">
                          {due <= 0.001 ? "Paid" : paid > 0 ? "Part paid" : "Unpaid"}
                        </small>
                      )}
                    </td>
                    {canManage && (
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            aria-label="Edit purchase"
                            onClick={() => {
                              setProductEditorOpen(false);
                              setEditor({
                                _id: purchase._id,
                                supplier: purchase.supplier?._id || "",
                                invoiceNo: purchase.invoiceNo || "",
                                status: purchase.status,
                                paidAmount: String(paid),
                                paymentMethod: "Cash",
                                items: purchase.items?.length
                                  ? purchase.items.map((item) => ({
                                      product:
                                        item.product?._id || item.product || "",
                                      quantity: String(item.quantity),
                                      cost: String(item.cost),
                                      batch: item.batch || "",
                                    }))
                                  : blankPurchase().items,
                              });
                            }}
                          >
                            <Pencil size={15} />
                          </button>
                          {paid <= 0 && (
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
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })),
                ];
              })}
              {!visiblePurchases.length && (
                <tr>
                  <td colSpan={columnCount} className="empty-table-cell">
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
                {(Number(editor.paidAmount || 0) <= 0 ||
                  editor.status === "Cancelled") && <option>Cancelled</option>}
              </select>
            </label>
          </div>
          <div className="purchase-items-heading">
            <b>Purchased products</b>
            <div className="purchase-heading-actions">
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
              {canManageInventory && (
                <button
                  type="button"
                  className="small-action"
                  onClick={() => {
                    const index = editor.items.length;
                    setEditor((current) => ({
                      ...current,
                      items: [
                        ...current.items,
                        { product: "", quantity: "", cost: "" },
                      ],
                    }));
                    openProductEditor(index);
                  }}
                >
                  <Plus size={14} /> New product
                </button>
              )}
            </div>
          </div>
          {productEditorOpen && (
            <section className="purchase-new-product">
              <h4>Add product to catalog</h4>
              <div className="form-grid">
                <label>
                  Product name
                  <input
                    value={newProduct.name}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Category
                  <input
                    value={newProduct.category}
                    onChange={(event) =>
                      setNewProduct({
                        ...newProduct,
                        category: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Selling price
                  <input
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={newProduct.price}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, price: event.target.value })
                    }
                  />
                </label>
                <label>
                  Purchase cost
                  <input
                    min="0"
                    step="0.01"
                    type="number"
                    value={newProduct.cost}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, cost: event.target.value })
                    }
                  />
                </label>
                <label className="form-span-2">
                  SKU (optional)
                  <input
                    value={newProduct.sku}
                    onChange={(event) =>
                      setNewProduct({ ...newProduct, sku: event.target.value })
                    }
                  />
                </label>
              </div>
              {productError && (
                <p className="field-error" role="alert">
                  {productError}
                </p>
              )}
              <div className="purchase-new-product-actions">
                <button
                  type="button"
                  className="outline-btn"
                  onClick={() => setProductEditorOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={createProduct}
                >
                  Add product
                </button>
              </div>
            </section>
          )}
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
          <div className="purchase-payment-summary">
            <div>
              <span>Purchase total</span>
              <strong>
                {money(
                  editor.items.reduce(
                    (sum, item) =>
                      sum +
                      Number(item.cost || 0) * Number(item.quantity || 0),
                    0,
                  ),
                )}
              </strong>
            </div>
            <div>
              <span>Already paid</span>
              <strong>{money(editor.paidAmount)}</strong>
            </div>
            <div>
              <span>Balance due</span>
              <strong>
                {money(
                  Math.max(
                    0,
                    editor.items.reduce(
                      (sum, item) =>
                        sum +
                        Number(item.cost || 0) * Number(item.quantity || 0),
                      0,
                    ) - Number(editor.paidAmount || 0),
                  ),
                )}
              </strong>
            </div>
          </div>
          {!editor._id && (
            <div className="form-grid purchase-initial-payment">
              <label>
                Paid now
                <input
                  min="0"
                  max={editor.items.reduce(
                    (sum, item) =>
                      sum +
                      Number(item.cost || 0) * Number(item.quantity || 0),
                    0,
                  )}
                  step="0.01"
                  type="number"
                  value={editor.paidAmount}
                  onChange={(event) =>
                    setEditor({ ...editor, paidAmount: event.target.value })
                  }
                />
              </label>
              <label>
                Payment method
                <select
                  value={editor.paymentMethod}
                  onChange={(event) =>
                    setEditor({ ...editor, paymentMethod: event.target.value })
                  }
                >
                  {availablePaymentMethods.map((method) => (
                    <option key={method._id || method.name}>{method.name}</option>
                  ))}
                </select>
              </label>
              <small className="form-span-2">
                Enter zero if the supplier will be paid later, or a smaller
                amount for a partial payment.
              </small>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Purchases;
