import { useEffect, useState } from "react";
import {
  CreditCard,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankPayment = {
  name: "",
  details: "",
  status: "Active",
  isDefault: false,
};
const blankUser = {
  name: "",
  email: "",
  role: "Cashier",
  status: "Active",
};

function SettingsPage({ settings, perform }) {
  const [storeForm, setStoreForm] = useState({
    name: "",
    logoUrl: "",
    receiptFooter: "",
    currency: "USD",
    taxRate: 0,
  });
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    setStoreForm({
      name: settings.store?.name || "FreshMart Supermarket",
      logoUrl: settings.store?.logoUrl || "",
      receiptFooter:
        settings.store?.receiptFooter ||
        "Thank you for shopping with FreshMart.",
      currency: settings.store?.currency || "USD",
      taxRate: settings.store?.taxRate ?? 0,
    });
  }, [settings.store?._id, settings.store?.updatedAt]);

  const saveStore = async (event) => {
    event.preventDefault();
    await perform(
      () => api.settings.update(storeForm),
      "Store settings saved.",
    );
  };

  const saveResource = async (event) => {
    event.preventDefault();
    const { type, _id, ...values } = editor;
    const resource = {
      payment: api.settings.paymentMethods,
      user: api.settings.users,
    }[type];
    const result = await perform(
      () => (_id ? resource.update(_id, values) : resource.create(values)),
      _id
        ? `${type === "user" ? "Team member" : "Payment method"} updated.`
        : `${type === "user" ? "Team member" : "Payment method"} added.`,
    );
    if (result) setEditor(null);
  };

  const removeResource = (resource, id, label) => {
    if (!window.confirm(`Remove this ${label.toLowerCase()}?`)) return;
    perform(() => resource.remove(id), `${label} removed.`);
  };

  const openEditor = (type, item = null) => {
    const defaults = {
      payment: blankPayment,
      user: blankUser,
    }[type];
    setEditor({ type, ...defaults, ...(item || {}) });
  };

  return (
    <div className="page settings-page">
      <section className="box settings-panel">
        <div className="settings-title">
          <span>
            <Settings size={17} />
          </span>
          <div>
            <h3>Store information</h3>
            <p>Manage the details shown on receipts and across your store.</p>
          </div>
        </div>
        <form onSubmit={saveStore}>
          <div className="form-grid brand-form">
            <label>
              Store name
              <input
                required
                value={storeForm.name}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, name: event.target.value })
                }
              />
            </label>
            <label>
              Logo URL
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={storeForm.logoUrl}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, logoUrl: event.target.value })
                }
              />
              <small>
                Enter a public image URL to display your store logo.
              </small>
            </label>
            <label>
              Currency
              <select
                value={storeForm.currency}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, currency: event.target.value })
                }
              >
                <option value="USD">USD — US Dollar</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </label>
            <label>
              Tax rate (%)
              <input
                min="0"
                max="100"
                step="0.01"
                type="number"
                value={storeForm.taxRate}
                onChange={(event) =>
                  setStoreForm({ ...storeForm, taxRate: event.target.value })
                }
              />
            </label>
            <label className="form-span-2">
              Receipt footer
              <textarea
                value={storeForm.receiptFooter}
                onChange={(event) =>
                  setStoreForm({
                    ...storeForm,
                    receiptFooter: event.target.value,
                  })
                }
              />
            </label>
          </div>
          <div className="settings-actions">
            <button type="submit" className="primary-btn">
              Save store settings
            </button>
          </div>
        </form>
      </section>

      <section className="box settings-panel">
        <div className="settings-title settings-section-heading">
          <span>
            <CreditCard size={17} />
          </span>
          <div>
            <h3>Payment methods</h3>
            <p>Choose the payment options available at checkout.</p>
          </div>
          <button className="primary-btn" onClick={() => openEditor("payment")}>
            <Plus size={15} /> Add payment method
          </button>
        </div>
        <div className="payment-method-grid">
          {settings.paymentMethods.map((method) => (
            <div className="payment-method-card" key={method._id}>
              <span className="resource-icon">
                <ShieldCheck size={16} />
              </span>
              <div className="resource-main">
                <b>{method.name}</b>
                <small>{method.details || "Checkout payment option"}</small>
              </div>
              {method.isDefault && (
                <span className="status-pill status-active">Default</span>
              )}
              <button
                className="icon-btn"
                aria-label="Edit payment method"
                onClick={() => openEditor("payment", method)}
              >
                <Pencil size={15} />
              </button>
              <button
                className="icon-btn danger-icon"
                aria-label="Delete payment method"
                onClick={() =>
                  removeResource(
                    api.settings.paymentMethods,
                    method._id,
                    "Payment method",
                  )
                }
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!settings.paymentMethods.length && (
            <p className="settings-empty">
              No payment methods have been added.
            </p>
          )}
        </div>
      </section>

      <section className="box settings-panel user-panel">
        <div className="settings-title settings-section-heading">
          <span>
            <Users size={17} />
          </span>
          <div>
            <h3>Team access</h3>
            <p>Manage store users and access roles.</p>
          </div>
          <button className="primary-btn" onClick={() => openEditor("user")}>
            <Plus size={15} /> Add team member
          </button>
        </div>
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-pill">{user.role}</span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${user.status === "Active" ? "status-active" : "status-inactive"}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn"
                        aria-label="Edit team member"
                        onClick={() => openEditor("user", user)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn danger-icon"
                        aria-label="Delete team member"
                        onClick={() =>
                          removeResource(
                            api.settings.users,
                            user._id,
                            "Team member",
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!settings.users.length && (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
                    <Users size={19} /> No team members have been added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editor && (
        <Modal
          title={`${
            editor._id ? "Edit" : "Add"
          } ${editor.type === "user" ? "team member" : "payment method"}`}
          onClose={() => setEditor(null)}
          onSubmit={saveResource}
        >
          {editor.type === "payment" && (
            <div className="form-grid">
              <label>
                Payment method name
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
              <label className="form-span-2">
                Details
                <input
                  value={editor.details}
                  onChange={(event) =>
                    setEditor({ ...editor, details: event.target.value })
                  }
                />
              </label>
              <label className="checkbox-field form-span-2">
                <input
                  type="checkbox"
                  checked={editor.isDefault}
                  onChange={(event) =>
                    setEditor({ ...editor, isDefault: event.target.checked })
                  }
                />
                Make this the default payment method
              </label>
            </div>
          )}
          {editor.type === "user" && (
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
                Email address
                <input
                  type="email"
                  required
                  value={editor.email}
                  onChange={(event) =>
                    setEditor({ ...editor, email: event.target.value })
                  }
                />
              </label>
              <label>
                Role
                <select
                  value={editor.role}
                  onChange={(event) =>
                    setEditor({ ...editor, role: event.target.value })
                  }
                >
                  <option>Cashier</option>
                  <option>Manager</option>
                  <option>Owner</option>
                </select>
              </label>
              <label className="form-span-2">
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
          )}
        </Modal>
      )}
    </div>
  );
}

export default SettingsPage;
