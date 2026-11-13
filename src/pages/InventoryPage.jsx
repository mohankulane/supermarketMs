import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Modal from "../components/common/Modal.jsx";
import BarcodeScanner from "../components/common/BarcodeScanner.jsx";
import { api } from "../api/api.js";

const blankProduct = {
  name: "",
  category: "",
  barcode: "",
  price: "",
  cost: "",
  stock: "",
  reorderLevel: 10,
  unit: "Each",
  image: "",
};

function Inventory({ products, perform, searchQuery = "" }) {
  const [query, setQuery] = useState(searchQuery);
  const [editor, setEditor] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState("");
  const [imageError, setImageError] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter(
      (product) =>
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search),
    );
  }, [products, query]);

  const saveProduct = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    if (!_id && !values.sku) delete values.sku;
    const result = await perform(
      () =>
        _id ? api.products.update(_id, values) : api.products.create(values),
      _id ? "Product updated." : "Product added to inventory.",
    );
    if (result) setEditor(null);
  };

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Select an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setImageError("Choose an image smaller than 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditor((current) => ({ ...current, image: reader.result }));
    };
    reader.onerror = () => setImageError("The image could not be read.");
    reader.readAsDataURL(file);
  };

  const saveStock = async (event) => {
    event.preventDefault();
    const quantity = Number(stockAmount);
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const result = await perform(
      () =>
        api.receiveStock(stockProduct._id, {
          quantity,
          type: "Received",
          note: "Manual inventory receipt",
        }),
      "Inventory stock updated.",
    );
    if (result) {
      setStockProduct(null);
      setStockAmount("");
    }
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Products</h3>
          <p>Manage your product catalog, prices, and stock levels.</p>
        </div>
        <div className="inventory-actions">
          <label className="table-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products..."
            />
          </label>
          <button className="outline-btn" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>
          <button
            className="primary-btn"
            onClick={() => {
              setImageError("");
              setEditor({ ...blankProduct });
            }}
          >
            <Plus size={16} /> Add product
          </button>
        </div>
      </section>

      <section className="box inventory-table-box">
        <div className="inventory-summary">
          <span>{products.length} products in inventory</span>
          <span>
            {
              products.filter(
                (product) => product.stock <= product.reorderLevel,
              ).length
            }{" "}
            need restocking
          </span>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const low = product.stock <= product.reorderLevel;
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <span className="product-image-placeholder">
                            <ImagePlus size={17} />
                          </span>
                        )}
                        <span>
                          <b>{product.name}</b>
                          <small>{product.unit || "Each"}</small>
                        </span>
                      </div>
                    </td>
                    <td>
                      <b>{product.sku}</b>
                      <small className="table-secondary">
                        {product.category}
                      </small>
                    </td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span
                        className={`status-pill ${low ? "status-warning" : "status-active"}`}
                      >
                        {low ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="small-action"
                          title="Receive stock"
                          onClick={() => {
                            setStockProduct(product);
                            setStockAmount("");
                          }}
                        >
                          <Plus size={14} /> Stock
                        </button>
                        <button
                          className="icon-btn"
                          title="Edit product"
                          onClick={() => {
                            setImageError("");
                            setEditor({
                              ...blankProduct,
                              ...product,
                              price: String(product.price),
                              cost: String(product.cost || 0),
                              stock: String(product.stock),
                              reorderLevel: String(product.reorderLevel),
                            });
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          title="Delete product"
                          onClick={() => {
                            if (window.confirm(`Delete ${product.name}?`)) {
                              perform(
                                () => api.products.remove(product._id),
                                "Product deleted.",
                              );
                            }
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!visibleProducts.length && (
                <tr>
                  <td colSpan="6" className="empty-table-cell">
                    <Package size={19} />
                    {products.length
                      ? "No products match your search."
                      : "No products yet. Add your first product to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editor && (
        <Modal
          title={editor._id ? "Edit product" : "Register a product"}
          onClose={() => setEditor(null)}
          onSubmit={saveProduct}
          submitLabel={editor._id ? "Save product" : "Add product"}
        >
          <div className="product-image-upload">
            {editor.image ? (
              <img src={editor.image} alt="Product preview" />
            ) : (
              <ImagePlus size={27} />
            )}
            <div>
              <b>Product image</b>
              <small>JPG, PNG or WebP, up to 3 MB</small>
              <label className="outline-btn upload-button">
                <Upload size={14} /> Choose image
                <input type="file" accept="image/*" onChange={selectImage} />
              </label>
            </div>
            {editor.image && (
              <button
                type="button"
                className="text-button danger-text"
                onClick={() =>
                  setEditor((current) => ({ ...current, image: "" }))
                }
              >
                Remove
              </button>
            )}
          </div>
          {imageError && <p className="field-error">{imageError}</p>}
          <div className="form-grid">
            <label>
              Product name
              <input
                required
                value={editor.name}
                onChange={(event) =>
                  setEditor({ ...editor, name: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <input
                required
                value={editor.category}
                onChange={(event) =>
                  setEditor({ ...editor, category: event.target.value })
                }
              />
            </label>
            <label>
              SKU {editor._id ? "" : "(automatic)"}
              <input
                readOnly
                value={editor.sku || "Generated when product is saved"}
                placeholder="Generated when product is saved"
              />
            </label>
            <label>
              <span>Barcode</span>
              <span className="barcode-entry">
                <input
                  autoFocus
                  value={editor.barcode || ""}
                  onChange={(event) =>
                    setEditor({ ...editor, barcode: event.target.value })
                  }
                  placeholder="Scan with a barcode reader"
                />
                <button
                  type="button"
                  className="outline-btn camera-scan-button"
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera size={15} /> Camera
                </button>
              </span>
              <small>
                Use a USB/Bluetooth scanner here or scan with the camera.
              </small>
            </label>
            <label>
              Selling price
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={editor.price}
                onChange={(event) =>
                  setEditor({ ...editor, price: event.target.value })
                }
              />
            </label>
            <label>
              Cost price
              <input
                min="0"
                step="0.01"
                type="number"
                value={editor.cost}
                onChange={(event) =>
                  setEditor({ ...editor, cost: event.target.value })
                }
              />
            </label>
            <label>
              Initial stock
              <input
                required
                min="0"
                type="number"
                value={editor.stock}
                onChange={(event) =>
                  setEditor({ ...editor, stock: event.target.value })
                }
              />
            </label>
            <label>
              Reorder level
              <input
                required
                min="0"
                type="number"
                value={editor.reorderLevel}
                onChange={(event) =>
                  setEditor({ ...editor, reorderLevel: event.target.value })
                }
              />
            </label>
            <label className="form-span-2">
              Unit
              <input
                value={editor.unit}
                onChange={(event) =>
                  setEditor({ ...editor, unit: event.target.value })
                }
                placeholder="Each, kg, box..."
              />
            </label>
          </div>
        </Modal>
      )}

      {stockProduct && (
        <Modal
          title={`Receive stock · ${stockProduct.name}`}
          onClose={() => setStockProduct(null)}
          onSubmit={saveStock}
          submitLabel="Receive stock"
        >
          <label className="field-label">
            Quantity received
            <input
              autoFocus
              required
              min="1"
              type="number"
              value={stockAmount}
              onChange={(event) => setStockAmount(event.target.value)}
            />
          </label>
        </Modal>
      )}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={(barcode) => {
            setEditor((current) => ({ ...current, barcode }));
            setScannerOpen(false);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}

export default Inventory;
