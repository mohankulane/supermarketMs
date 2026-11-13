import { useState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import freshmartLogo from "../assets/freshmart-logo.svg";
import supermarketIllustration from "../assets/supermarket-illustration.svg";

function Login({ login, loading, error }) {
  const [email, setEmail] = useState(
    () => localStorage.getItem("freshmart-login-email") || "",
  );
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("freshmart-login-email")),
  );
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rememberMe) {
      localStorage.setItem("freshmart-login-email", email);
    } else {
      localStorage.removeItem("freshmart-login-email");
    }
    login();
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand" aria-label="FreshMart">
          <a className="login-brand-name" href="/" aria-label="FreshMart home">
            <img src={freshmartLogo} alt="" />
            <span>
              Fresh<span>Mart</span>
            </span>
          </a>
          <div className="login-brand-copy">
            <p className="login-eyebrow">YOUR STORE, IN GOOD HANDS</p>
            <h1>Everything your store needs, all in one place.</h1>
            <p className="login-brand-description">
              Keep your shelves stocked, your sales moving, and your business
              growing with FreshMart.
            </p>
          </div>
          <img
            className="login-illustration"
            src={supermarketIllustration}
            alt="A shopping basket filled with fresh groceries"
          />
          <p className="login-brand-footer">A brighter way to run your store.</p>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-content">
            <p className="login-eyebrow">WELCOME BACK</p>
            <h2 id="login-title">Sign in to FreshMart</h2>
            <p className="login-subtitle">
              Enter your details to access your store dashboard.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@yourstore.com"
                  autoComplete="email"
                  required
                />
              </div>

              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  className="forgot-password"
                  type="button"
                  aria-expanded={showPasswordHelp}
                  onClick={() => setShowPasswordHelp((visible) => !visible)}
                >
                  Forgot password?
                </button>
              </div>

              {showPasswordHelp && (
                <p className="password-help" role="status">
                  Password resets are handled by your store administrator.
                  Please contact them for help.
                </p>
              )}

              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="primary login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Connecting..." : "Sign in"}
              </button>
            </form>

            <p className="login-access-note">
              Need access? Contact your store administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
