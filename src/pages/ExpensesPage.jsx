import { useState } from "react";
import TableHeader, { matchesQuery } from "../components/common/TableHeader.jsx";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { api } from "../api/api.js";
import Modal from "../components/common/Modal.jsx";

const blankExpense = () => ({
  category: "Transport",
  amount: "",
  description: "",
  paymentMethod: "Cash",
  expenseDate: new Date().toISOString().slice(0, 10),
});

function Expenses({ expenses, perform, canManage = false }) {
  const [editor, setEditor] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(expenses.map((expense) => expense.category).filter(Boolean)),
  ];
  const visibleExpenses = expenses.filter(
    (expense) =>
      (category === "All" || expense.category === category) &&
      matchesQuery(query, expense.category, expense.description, expense.paymentMethod),
  );

  const saveExpense = async (event) => {
    event.preventDefault();
    const { _id, ...values } = editor;
    const result = await perform(
      () =>
        _id ? api.expenses.update(_id, values) : api.expenses.create(values),
      _id ? "Expense updated." : "Expense recorded.",
    );
    if (result) setEditor(null);
  };

  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Expense records</h3>
          <p>Track store costs and keep expense records up to date.</p>
        </div>
        {canManage && (
          <button
            className="primary-btn"
            onClick={() => setEditor(blankExpense())}
          >
            <Plus size={16} /> Add expense
          </button>
        )}
      </section>
      <section className="box inventory-table-box">
        <TableHeader
          title="Expenses"
          icon={Wallet}
          count={visibleExpenses.length}
          total={expenses.length}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search expenses..."
          filter={{
            label: "Category",
            value: category,
            onChange: setCategory,
            options: categories.map((item) => [item, item === "All" ? "All categories" : item]),
          }}
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment method</th>
                <th>Amount</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {visibleExpenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td>{expense.category}</td>
                  <td>{expense.description || "—"}</td>
                  <td>{expense.paymentMethod || "Cash"}</td>
                  <td>${Number(expense.amount).toFixed(2)}</td>
                  {canManage && (
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          aria-label="Edit expense"
                          onClick={() =>
                            setEditor({
                              ...blankExpense(),
                              ...expense,
                              expenseDate: new Date(expense.expenseDate)
                                .toISOString()
                                .slice(0, 10),
                            })
                          }
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          aria-label="Delete expense"
                          onClick={() => {
                            if (window.confirm("Delete this expense record?")) {
                              perform(
                                () => api.expenses.remove(expense._id),
                                "Expense deleted.",
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
              {!visibleExpenses.length && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="empty-table-cell">
                    <Wallet size={19} /> No expenses have been recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editor && (
        <Modal
          title={editor._id ? "Edit expense" : "Add expense"}
          onClose={() => setEditor(null)}
          onSubmit={saveExpense}
        >
          <div className="form-grid">
            <label>
              Category
              <select
                value={editor.category}
                onChange={(event) =>
                  setEditor({ ...editor, category: event.target.value })
                }
              >
                {[
                  "Transport",
                  "Rent",
                  "Utilities",
                  "Salaries",
                  "Supplies",
                  "Other",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Amount
              <input
                required
                min="0.01"
                step="0.01"
                type="number"
                value={editor.amount}
                onChange={(event) =>
                  setEditor({ ...editor, amount: event.target.value })
                }
              />
            </label>
            <label>
              Date
              <input
                required
                type="date"
                value={editor.expenseDate}
                onChange={(event) =>
                  setEditor({ ...editor, expenseDate: event.target.value })
                }
              />
            </label>
            <label>
              Payment method
              <input
                value={editor.paymentMethod}
                onChange={(event) =>
                  setEditor({ ...editor, paymentMethod: event.target.value })
                }
              />
            </label>
            <label className="form-span-2">
              Description
              <input
                value={editor.description}
                onChange={(event) =>
                  setEditor({ ...editor, description: event.target.value })
                }
              />
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Expenses;
