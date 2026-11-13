import { History } from "lucide-react";

function Audit({ audit = [] }) {
  return (
    <div className="page">
      <section className="box inventory-toolbar">
        <div>
          <h3>Audit log</h3>
          <p>Review recorded changes and system activity.</p>
        </div>
      </section>
      <section className="box inventory-table-box">
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
              {audit.map((entry) => (
                <tr key={entry._id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td>{entry.action}</td>
                  <td>{entry.entity}</td>
                  <td>{entry.actor || "System"}</td>
                  <td>{entry.details || "—"}</td>
                </tr>
              ))}
              {!audit.length && (
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
