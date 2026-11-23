import { useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import freshmartLogo from "../assets/freshmart-logo.svg";

function FirstRunSetupPage({ onSetup, loading, error, logoUrl }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    await onSetup({ name, email, password });
  };

  return (
    <main className="login-page">
      <section className="login-card first-run-card">
        <div className="login-card-content">
          <a className="login-brand-name" href="/" aria-label="FreshMart home">
            <img
              src={logoUrl || freshmartLogo}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = freshmartLogo;
              }}
            />
            <span>FreshMart</span>
          </a>
          <p className="login-eyebrow">FIRST-TIME SETUP</p>
          <h2 id="login-title">Create the Owner account</h2>
          <p className="login-subtitle">
            This setup is available once. The Owner can then create accounts
            and assign access.
          </p>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="owner-name">Full name</label>
            <div className="login-input-wrap">
              <UserRound size={17} aria-hidden="true" />
              <input
                id="owner-name"
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <label htmlFor="owner-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="owner-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <label htmlFor="owner-password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="owner-password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <label htmlFor="owner-confirm-password">Confirm password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="owner-confirm-password"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              {loading ? "Creating account..." : "Create Owner account"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default FirstRunSetupPage;
