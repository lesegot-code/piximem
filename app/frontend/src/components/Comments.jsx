// Student Number: u25143230
import { useState } from "react";
import { addComment, deleteComment } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import { timeAgo, fullDate } from "../utils/format.js";
import Avatar from "./Avatar.jsx";
import UserName from "./UserName.jsx";

const MAX = 300;
const SHOW_FIRST = 5;

export default function Comments({ post, onChange })
{
  const { user } = useAuth();
  const { toast, confirm } = useUi();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const all = post.comments;
  //newest few by default, everything when expanded
  const visible = showAll ? all : all.slice(-SHOW_FIRST);

  async function handleSubmit(e)
  {
    e.preventDefault();
    const trimmed = text.trim();
    if(!trimmed) return setError("Write something before posting your comment.");

    setBusy(true);
    setError("");
    try
    {
      const updated = await addComment(post._id, trimmed);
      setText("");
      onChange(updated);
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

  async function handleDelete(comment)
  {
    const ok = await confirm({ title: "Delete comment?", message: "This comment will be removed for everyone.", confirmLabel: "Delete", danger: true });
    if(!ok) return;

    try
    {
      onChange(await deleteComment(post._id, comment._id));
      toast("Comment deleted");
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  //comment author, post owner and admins can delete
  const canDelete = (c) => user.isAdmin || c.author?._id === user._id || post.isOwner;

  return(
    <section className="space-y-4" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="font-heading text-ink text-base">Comments ({all.length})</h2>

      {all.length === 0 && <p className="text-sm text-muted">No comments yet. Start the conversation.</p>}

      {all.length > SHOW_FIRST &&(
        <button type="button" onClick={() => setShowAll((v) => !v)} className="link text-sm">
          {showAll ? "Show only the newest" : `Show all ${all.length} comments`}
        </button>
      )}

      <ul className="space-y-3">
        {visible.map((c) =>(
          <li key={c._id} className="flex gap-2">
            <Avatar user={c.author} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <UserName user={c.author?._id ? c.author : null} className="text-sm" />
                <time className="text-xs text-muted" dateTime={c.createdAt} title={fullDate(c.createdAt)}>
                  {timeAgo(c.createdAt)}
                </time>
                {canDelete(c) &&(
                  <button type="button" onClick={() => handleDelete(c)} className="text-xs text-muted hover:text-danger ml-auto">
                    Delete
                  </button>
                )}
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap break-words">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-border" noValidate>
        <label htmlFor="new-comment" className="label pt-2">Add a comment</label>
        <textarea
          id="new-comment"
          className="input resize-none"
          rows={2}
          value={text}
          onChange={(e) => { setText(e.target.value); setError(""); }}
          placeholder="Write a comment…"
          maxLength={MAX}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{text.length}/{MAX}</span>
          <button type="submit" disabled={busy} className="btn-primary btn-sm">
            {busy ? "Posting…" : "Post comment"}
          </button>
        </div>
        {error && <p className="error-box" role="alert">{error}</p>}
      </form>
    </section>
  );
}
