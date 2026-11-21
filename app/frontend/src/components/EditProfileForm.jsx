// Student Number: u25143230
import { useState } from "react";
import { updateUser } from "../api.js";
import ImageDropzone, { useFilePreview } from "./ImageDropzone.jsx";
import Avatar from "./Avatar.jsx";

const FIELDS = [
  { key: "name", label: "Display name", max: 60, placeholder: "How your name shows on posts" },
  { key: "username", label: "Username", max: 30, placeholder: "letters, numbers, . and _" },
  { key: "pronouns", label: "Pronouns", max: 30, placeholder: "e.g. she/her" },
  { key: "location", label: "Location", max: 60, placeholder: "e.g. Pretoria" },
  { key: "website", label: "Website or social link", max: 200, placeholder: "e.g. instagram.com/you" },
];

//edit profile details and picture (also used by admins to edit any account)
export default function EditProfileForm({ user, onSaved, onCancel })
{
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    pronouns: user.pronouns || "",
    location: user.location || "",
    website: user.website || "",
    bio: user.bio || "",
  });
  const [file, setFile] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useFilePreview(file);

  const hasPhoto = (user.avatar && !removePhoto) || file;

  function change(key, value)
  {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  async function handleSubmit(e)
  {
    e.preventDefault();
    if(form.username.trim().length < 2) return setError("Your username needs at least 2 characters.");

    setBusy(true);
    setError("");
    try
    {
      const { user: saved } = await updateUser(user._id, {
        ...form,
        avatar: file || undefined,
        removeAvatar: removePhoto && !file ? "true" : undefined,
        shuffleAvatar: shuffle ? "true" : undefined,
      });
      onSaved(saved);
    }
    catch(err)
    {
      setError(err.message);
      setBusy(false);
    }
  }

  return(
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ImageDropzone
        label="Profile picture"
        compact
        round
        preview={preview || (hasPhoto ? user.avatar : null)}
        onFile={(f) => { setFile(f); setRemovePhoto(false); }}
        onError={setError}
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {hasPhoto
          ? (
            <button type="button" className="link" onClick={() => { setFile(null); setRemovePhoto(true); }}>
              Remove photo and use a generated avatar
            </button>
          )
          : (
            <>
              <Avatar user={{ ...user, avatar: null, avatarSeed: shuffle ? `${user.avatarSeed}-next` : user.avatarSeed }} size="md" />
              <button type="button" className="link" onClick={() => setShuffle((s) => !s)}>
                {shuffle ? "Keep my current pattern" : "Shuffle my generated avatar"}
              </button>
              {shuffle && <span className="text-xs text-muted">A brand new pattern is made when you save.</span>}
            </>
          )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map((f) =>(
          <div key={f.key} className={f.key === "website" ? "sm:col-span-2" : ""}>
            <label htmlFor={`profile-${f.key}`} className="label">{f.label}</label>
            <input
              id={`profile-${f.key}`}
              className="input"
              value={form[f.key]}
              maxLength={f.max}
              placeholder={f.placeholder}
              onChange={(e) => change(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="profile-bio" className="label">Bio</label>
        <textarea
          id="profile-bio"
          className="input resize-none"
          rows={3}
          value={form.bio}
          onChange={(e) => change("bio", e.target.value)}
          maxLength={200}
          placeholder="A short intro for other people"
        />
        <p className="text-xs text-muted mt-1 text-right">{form.bio.length}/200</p>
      </div>

      <p className="text-xs text-muted">Everything here is public. Your email address is never shown to other people.</p>

      {error && <p className="error-box" role="alert">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save changes"}</button>
      </div>
    </form>
  );
}
