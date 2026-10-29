// Student Number: u25143230
import { useState } from "react";
import { addComment } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

export default function Comments({ post, onUpdated })
{
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const all = post.comments || [];
  const visible = showAll ? all : all.slice(-3);

  async function handleSubmit(e)
  {
    e.preventDefault();
    const trimmed = text.trim();

    if(trimmed.length < 1)
    {
      setError("Comment cannot be empty.");
      return;
    }
    if(trimmed.length > 300)
    {
      setError("Comment is too long (max 300 characters).");
      return;
    }

    setBusy(true);
    setError("");

    try
    {
      await addComment(post._id, user._id, trimmed);
      setText("");
      if(onUpdated) onUpdated();
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
    <section className="space-y-3">
      <h3 className="font-heading text-ink text-base">
        Comments ({all.length})
      </h3>

      {/* list */}
      {all.length === 0 &&(
        <p className="text-sm text-muted">Be the first to comment.</p>
      )}

      {all.length > 3 &&(
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-pixblue text-sm font-medium hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${all.length} comments`}
        </button>
      )}

      <ul className="space-y-3">
        {visible.map((c) =>(
          <li key={c._id || c.createdAt} className="flex gap-2">
            <Avatar name={c.username || "User"} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm text-ink">
                  {c.username || "User"}
                </span>
                <span className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>

      {/* add form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2">
        <textarea
          className="input resize-none"
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          maxLength={300}
          required
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{text.length}/300</span>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Posting…" : "Comment"}
          </button>
        </div>
        {error &&(
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}