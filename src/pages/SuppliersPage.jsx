import { useState } from "react";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankSupplier = { name: "", contact: "", email: "", status: "Active" };

function Suppliers({ suppliers, perform }) {
  const [editor, setEditor] = useState(null);

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
        <button
          className="primary-btn"
          onClick={() => setEditor({ ...blankSupplier })}
        >
          <Plus size={16} /> Add supplier
        </button>
      </section>
      <section className="box inventory-table-box">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact || "—"}</td>
                  <td>{supplier.email || "—"}</td>
                  <td>
                    <span
                      className={`status-pill ${supplier.status === "Active" ? "status-active" : "status-inactive"}`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
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
                </tr>
              ))}
              {!suppliers.length && (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
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
    </div>
  );
}

export default Suppliers;
