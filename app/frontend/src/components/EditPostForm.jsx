// Student Number: u25143230
import { useState } from "react";
import { updatePost } from "../api.js";

export default function EditPostForm({ post, onSaved, onCancel })
{
  const [caption, setCaption] = useState(post.caption || "");
  const [hashtagInput, setHashtagInput] = useState(
    (post.hashtags || []).join(" ")
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function parseHashtags(input)
  {
    return input
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
  }

  async function handleSubmit(e)
  {
    e.preventDefault();

    if(caption.trim().length < 3)
    {
      setError("Caption must be at least 3 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try
    {
      await updatePost(post._id, {
        caption: caption.trim(),
        hashtags: parseHashtags(hashtagInput),
      });
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
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2 className="font-heading text-lg text-ink">Edit post</h2>

      <p className="text-xs text-muted">
        The image cannot be changed after posting.
      </p>

      <div>
        <label htmlFor="edit-caption" className="block text-sm text-muted mb-1">
          Caption
        </label>
        <textarea
          id="edit-caption"
          className="input resize-none"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          required
        />
        <p className="text-xs text-muted mt-1">{caption.length}/500</p>
      </div>

      <div>
        <label htmlFor="edit-tags" className="block text-sm text-muted mb-1">
          Hashtags (separate with spaces or commas)
        </label>
        <input
          id="edit-tags"
          className="input"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
        />
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