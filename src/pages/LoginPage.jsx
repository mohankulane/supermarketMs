import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import freshmartLogo from "../assets/freshmart-logo.svg";
import LoginIllustration from "../components/common/LoginIllustration.jsx";

function Login({ login, loading, error, logoUrl, storeName = "FreshMart" }) {
  const [email, setEmail] = useState(
    () => localStorage.getItem("freshmart-login-email") || "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("freshmart-login-email")),
  );
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (rememberMe) {
      localStorage.setItem("freshmart-login-email", email);
    } else {
      localStorage.removeItem("freshmart-login-email");
    }
    await login({ email, password });
  };

  return (
    <main className="signin">
      <div className="signin-waves" aria-hidden="true" />

      <div className="signin-card">
        <span className="signin-pill pill-a" aria-hidden="true" />
        <span className="signin-pill pill-b" aria-hidden="true" />
        <span className="signin-pill pill-c" aria-hidden="true" />
        <span className="signin-pill pill-d" aria-hidden="true" />
        <span className="signin-pill pill-e" aria-hidden="true" />
        <span className="signin-dot" aria-hidden="true" />

        <section className="signin-art">
          <div className="signin-brand">
            <img
              src={logoUrl || freshmartLogo}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = freshmartLogo;
              }}
            />
            <span>{storeName}</span>
          </div>
          <LoginIllustration />
        </section>

        <section className="signin-form-side" aria-labelledby="login-title">
          <h1 id="login-title">Sign in to {storeName}</h1>
          <p className="signin-subtitle">
            Enter your details to open your store dashboard.
          </p>

          <form className="signin-form" onSubmit={handleSubmit}>
            <label className="signin-field">
              <Mail size={17} aria-hidden="true" />
              <input
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                autoComplete="email"
                required
              />
            </label>

            <label className="signin-field">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                aria-label="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="signin-eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </label>

            <label className="signin-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>

            {error && (
              <p className="signin-error" role="alert">
                {error}
              </p>
            )}

            <button className="signin-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Log in"}
            </button>

            <button
              className="signin-link"
              type="button"
              aria-expanded={showPasswordHelp}
              onClick={() => setShowPasswordHelp((visible) => !visible)}
            >
              Forgot password?
            </button>
            {showPasswordHelp && (
              <p className="signin-help" role="status">
                Password resets are handled by your store administrator. Please
                contact them for help.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default Login;
