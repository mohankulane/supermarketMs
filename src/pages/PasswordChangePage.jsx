import { useState } from "react";
import { LockKeyhole } from "lucide-react";

function PasswordChangePage({ user, onChangePassword, loading, error }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (password !== confirmation) {
      setFormError("Passwords do not match.");
      return;
    }
    await onChangePassword(password);
  };

  return (
    <main className="login-page">
      <section className="login-card first-run-card">
        <div className="login-card-content">
          <p className="login-eyebrow">SECURE YOUR ACCOUNT</p>
          <h2>Choose a new password</h2>
          <p className="login-subtitle">
            Welcome, {user.name}. Change your temporary password to continue.
          </p>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="new-password">New password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="new-password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <label htmlFor="confirm-new-password">Confirm new password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="confirm-new-password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
            {(formError || error) && (
              <p className="login-error" role="alert">
                {formError || error}
              </p>
            )}
            <button
              className="primary login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "Set new password"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default PasswordChangePage;
