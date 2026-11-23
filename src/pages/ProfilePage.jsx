import { useRef, useState } from "react";
import { BadgeCheck, Camera, KeyRound, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { PERMISSION_GROUPS } from "../auth/permissions.js";

const permissionLabels = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((group) => group.permissions),
);

const AVATAR_SIZE = 256;

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That file is not a supported image."));
      image.onload = () => {
        const side = Math.min(image.width, image.height);
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        canvas
          .getContext("2d")
          .drawImage(
            image,
            (image.width - side) / 2,
            (image.height - side) / 2,
            side,
            side,
            0,
            0,
            AVATAR_SIZE,
            AVATAR_SIZE,
          );
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePage({ user, onChangePassword, onChangeAvatar, busy }) {
  const fileInput = useRef(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const choosePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setPhotoError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Choose an image smaller than 10 MB.");
      return;
    }
    setPhotoBusy(true);
    try {
      await onChangeAvatar(await resizeImage(file));
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    await onChangeAvatar("");
    setPhotoBusy(false);
  };
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
    const ok = await onChangePassword(password);
    if (ok) {
      setPassword("");
      setConfirmation("");
    }
  };

  const access =
    user.role === "Owner"
      ? ["Full access to every page"]
      : (user.permissions || []).map((permission) => permissionLabels[permission] || permission);

  const details = [
    { label: "Full name", value: user.name, icon: UserRound },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Role", value: user.role, icon: ShieldCheck },
    { label: "Status", value: user.status || "Active", icon: BadgeCheck },
  ];

  return (
    <div className="page profile-page">
      <section className="box profile-hero">
        <button
          type="button"
          className="profile-hero-avatar profile-photo-button"
          onClick={() => fileInput.current?.click()}
          disabled={photoBusy}
          aria-label="Change profile photo"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            user.name.slice(0, 2).toUpperCase()
          )}
          <span className="profile-photo-overlay">
            <Camera size={18} />
          </span>
        </button>
        <div className="profile-hero-text">
          <h3>{user.name}</h3>
          <p>
            {user.role} · {user.email}
          </p>
          <div className="profile-photo-actions">
            <button
              type="button"
              className="outline-btn"
              onClick={() => fileInput.current?.click()}
              disabled={photoBusy}
            >
              <Camera size={15} />
              {photoBusy ? "Saving..." : user.avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {user.avatarUrl && (
              <button
                type="button"
                className="outline-btn danger-outline"
                onClick={removePhoto}
                disabled={photoBusy}
              >
                <Trash2 size={15} /> Remove
              </button>
            )}
          </div>
          {photoError && (
            <p className="profile-form-error" role="alert">
              {photoError}
            </p>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={choosePhoto}
          />
        </div>
      </section>

      <div className="profile-grid">
        <section className="box">
          <h3 className="profile-section-title">Account details</h3>
          <dl className="profile-details">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <dt>
                  <Icon size={15} /> {label}
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="profile-section-title">Your access</h3>
          <div className="profile-access">
            {access.length ? (
              access.map((item) => <span key={item}>{item}</span>)
            ) : (
              <p>No pages assigned.</p>
            )}
          </div>
        </section>

        <section className="box">
          <h3 className="profile-section-title">
            <KeyRound size={16} /> Change password
          </h3>
          <form className="profile-form" onSubmit={submit}>
            <label>
              New password
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <small>Use at least 10 characters.</small>
            {formError && (
              <p className="profile-form-error" role="alert">
                {formError}
              </p>
            )}
            <button className="primary-btn" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;
