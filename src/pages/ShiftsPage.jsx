import { useState } from "react";
import { Clock3, Plus, Trash2 } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

function Shifts({ shifts, perform }) {
  const [openForm, setOpenForm] = useState(null);
  const [closeForm, setCloseForm] = useState(null);

  const openShift = async (event) => {
    event.preventDefault();
    const result = await perform(
      () =>
        api.openShift({
          cashier: openForm.cashier,
          openingCash: Number(openForm.openingCash),
        }),
      "Cashier shift opened.",
    );
    if (result) setOpenForm(null);
  };

  const closeShift = async (event) => {
    event.preventDefault();
    const result = await perform(
      () =>
        api.closeShift(closeForm._id, {
          closingCash: Number(closeForm.closingCash),
          expectedCash: Number(closeForm.expectedCash),
        }),
      "Cashier shift closed.",
    );
    if (result) setCloseForm(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Cashier shifts</h3>
          <p>Open and close shifts and reconcile cash at the register.</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => setOpenForm({ cashier: "", openingCash: "" })}
        >
          <Plus size={16} /> Open shift
        </button>
      </section>
      <section className="box inventory-table-box">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Cashier</th>
                <th>Opened</th>
                <th>Opening cash</th>
                <th>Closing cash</th>
                <th>Variance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift._id}>
                  <td>{shift.cashier}</td>
                  <td>{new Date(shift.createdAt).toLocaleString()}</td>
                  <td>${Number(shift.openingCash || 0).toFixed(2)}</td>
                  <td>
                    {shift.closingCash == null
                      ? "—"
                      : `$${Number(shift.closingCash).toFixed(2)}`}
                  </td>
                  <td>
                    {shift.variance == null
                      ? "—"
                      : `$${Number(shift.variance).toFixed(2)}`}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${shift.status === "Open" ? "status-warning" : "status-active"}`}
                    >
                      {shift.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {shift.status === "Open" && (
                        <button
                          className="small-action"
                          onClick={() =>
                            setCloseForm({
                              ...shift,
                              expectedCash: String(
                                shift.expectedCash ?? shift.openingCash ?? 0,
                              ),
                              closingCash: "",
                            })
                          }
                        >
                          Close shift
                        </button>
                      )}
                      <button
                        className="icon-btn danger-icon"
                        aria-label="Delete shift"
                        onClick={() => {
                          if (window.confirm("Delete this shift record?")) {
                            perform(
                              () => api.shifts.remove(shift._id),
                              "Shift record deleted.",
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
              {!shifts.length && (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    <Clock3 size={19} /> No shifts have been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {openForm && (
        <Modal
          title="Open cashier shift"
          onClose={() => setOpenForm(null)}
          onSubmit={openShift}
          submitLabel="Open shift"
        >
          <div className="form-grid">
            <label>
              Cashier name
              <input
                required
                value={openForm.cashier}
                onChange={(event) =>
                  setOpenForm({ ...openForm, cashier: event.target.value })
                }
              />
            </label>
            <label>
              Opening cash
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={openForm.openingCash}
                onChange={(event) =>
                  setOpenForm({ ...openForm, openingCash: event.target.value })
                }
              />
            </label>
          </div>
        </Modal>
      )}
      {closeForm && (
        <Modal
          title={`Close shift · ${closeForm.cashier}`}
          onClose={() => setCloseForm(null)}
          onSubmit={closeShift}
          submitLabel="Close shift"
        >
          <div className="form-grid">
            <label>
              Expected cash
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={closeForm.expectedCash}
                onChange={(event) =>
                  setCloseForm({
                    ...closeForm,
                    expectedCash: event.target.value,
                  })
                }
              />
            </label>
            <label>
              Counted closing cash
              <input
                autoFocus
                required
                min="0"
                step="0.01"
                type="number"
                value={closeForm.closingCash}
                onChange={(event) =>
                  setCloseForm({
                    ...closeForm,
                    closingCash: event.target.value,
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

export default Shifts;
