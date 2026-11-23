import { useState } from "react";
import { History } from "lucide-react";
import TableHeader, { matchesQuery } from "../components/common/TableHeader.jsx";

function Audit({ audit = [], embedded = false }) {
  const [query, setQuery] = useState("");
  const visibleAudit = audit.filter((entry) =>
    matchesQuery(query, entry.action, entry.entity, entry.actor, entry.details),
  );
  return (
    <div className={embedded ? "audit-embedded" : "page"}>
      <section
        className={`box ${embedded ? "settings-panel" : "inventory-toolbar"}`}
      >
        <div>
          <h3>Audit log</h3>
          <p>Review recorded changes and system activity.</p>
        </div>
      </section>
      <section className={`box inventory-table-box${embedded ? " settings-panel" : ""}`}>
        <TableHeader
          title="Activity"
          icon={History}
          count={visibleAudit.length}
          total={audit.length}
          query={query}
          onQueryChange={setQuery}
          placeholder="Search activity..."
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleAudit.map((entry) => (
                <tr key={entry._id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.action}</td>
                  <td>{entry.entity}</td>
                  <td>{entry.actor || "System"}</td>
                  <td>{entry.details || "—"}</td>
                </tr>
              ))}
              {!visibleAudit.length && (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
                    <History size={19} /> No activity has been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Audit;
