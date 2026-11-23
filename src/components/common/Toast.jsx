import { useEffect } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, type === "error" ? 6000 : 3500);
    return () => window.clearTimeout(timer);
  }, [message, onClose, type]);

  if (!message) return null;
  const Icon = type === "error" ? XCircle : CheckCircle2;

  return (
    <div
      className={`app-toast ${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <Icon size={18} />
      <span>{message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  );
}

export default Toast;
