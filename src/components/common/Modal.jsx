import { X } from "lucide-react";

function Modal({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Save changes",
}) {
  return (
    <div className="dialog-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <div>
            <h2>{title}</h2>
            <p>Enter the details below, then save your changes.</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="dialog-body">{children}</div>
          <div className="dialog-footer">
            <button type="button" className="outline-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {submitLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Modal;
