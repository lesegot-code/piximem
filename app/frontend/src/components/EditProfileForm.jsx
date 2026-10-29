// Student Number: u25143230
import { useRef, useState } from "react";
import { updateUser, buildImageUrl } from "../api.js";

export default function EditProfileForm({ user, onSaved, onCancel })
{
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    buildImageUrl(user.avatar) || null
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function pickFile(f)
  {
    if(!f) return;
    if(!f.type.startsWith("image/"))
    {
      setError("Only image files are allowed.");
      return;
    }
    if(f.size > 5 * 1024 * 1024)
    {
      setError("Image is too large (max 5 MB).");
      return;
    }
    setError("");
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  function handleDrop(e)
  {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit(e)
  {
    e.preventDefault();

    if(username.trim().length < 2)
    {
      setError("Username must be at least 2 characters.");
      return;
    }
    if(bio.length > 200)
    {
      setError("Bio must be 200 characters or fewer.");
      return;
    }

    setBusy(true);
    setError("");

    try
    {
      const updates = { username: username.trim(), bio: bio.trim() };
      if(avatarFile) updates.avatar = avatarFile;

      await updateUser(user._id, updates);
      if(onSaved) onSaved();
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setBusy(false);
    }
  }

  return(
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-heading text-lg text-ink">Edit profile</h2>

      {/* avatar drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center gap-4 p-3 border-2 border-dashed rounded-xl cursor-pointer transition ${
          dragging ? "border-pixblue bg-pixblue/10" : "border-border hover:border-pixblue/60"
        }`}
      >
        {avatarPreview ?(
          <img
            src={avatarPreview}
            alt="Avatar preview"
            className="w-16 h-16 rounded-full object-cover border border-border"
          />
        ) :(
          <div className="w-16 h-16 rounded-full bg-bg border border-border flex items-center justify-center text-muted text-xs">
            No photo
          </div>
        )}
        <div className="text-sm">
          <p className="font-medium text-ink">Profile picture</p>
          <p className="text-muted">Drag & drop, or click to choose</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <div>
        <label htmlFor="edit-username" className="block text-sm text-muted mb-1">
          Username
        </label>
        <input
          id="edit-username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          maxLength={40}
        />
      </div>

      <div>
        <label htmlFor="edit-bio" className="block text-sm text-muted mb-1">
          Bio
        </label>
        <textarea
          id="edit-bio"
          className="input resize-none"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder="A short intro for other users…"
        />
        <p className="text-xs text-muted mt-1">{bio.length}/200</p>
      </div>

      {error &&(
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}