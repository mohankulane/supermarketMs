import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankCustomer = { name: "", phone: "", email: "" };

function Customers({ customers, perform }) {
  const [editor, setEditor] = useState(null);

  const saveCustomer = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    const result = await perform(
      () =>
        _id ? api.customers.update(_id, values) : api.customers.create(values),
      _id ? "Customer updated." : "Customer added.",
    );
    if (result) setEditor(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Customer directory</h3>
          <p>Manage customer contact details and account activity.</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => setEditor({ ...blankCustomer })}
        >
          <Plus size={16} /> Add customer
        </button>
      </section>
      <section className="box inventory-table-box">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Visits</th>
                <th>Total spend</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div className="customer-cell">
                      <span>{customer.name.slice(0, 1).toUpperCase()}</span>
                      <b>{customer.name}</b>
                    </div>
                  </td>
                  <td>{customer.phone || "—"}</td>
                  <td>{customer.email || "—"}</td>
                  <td>{customer.visits || 0}</td>
                  <td>${Number(customer.spent || 0).toFixed(2)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        aria-label="Edit customer"
                        onClick={() =>
                          setEditor({
                            ...blankCustomer,
                            ...customer,
                          })
                        }
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn danger-icon"
                        aria-label="Delete customer"
                        onClick={() => {
                          if (window.confirm(`Delete ${customer.name}?`)) {
                            perform(
                              () => api.customers.remove(customer._id),
                              "Customer deleted.",
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
              {!customers.length && (
                <tr>
                  <td colSpan="6" className="empty-table-cell">
                    <Users size={20} /> No customers yet. Add your first
                    customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editor && (
        <Modal
          title={editor._id ? "Edit customer" : "Add customer"}
          onClose={() => setEditor(null)}
          onSubmit={saveCustomer}
        >
          <div className="form-grid">
            <label>
              Full name
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
              Phone number
              <input
                value={editor.phone || ""}
                onChange={(event) =>
                  setEditor({ ...editor, phone: event.target.value })
                }
              />
            </label>
            <label className="form-span-2">
              Email address
              <input
                type="email"
                value={editor.email || ""}
                onChange={(event) =>
                  setEditor({ ...editor, email: event.target.value })
                }
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Customers;
