// Student Number: u25143230
import { useState } from "react";
import { admin, getReasons } from "../../api.js";
import { useUi } from "../../context/UiContext.jsx";
import { useAdminList } from "./useAdminList.js";
import Avatar from "../Avatar.jsx";
import UserName from "../UserName.jsx";
import { timeAgo } from "../../utils/format.js";

//the reasons people can pick when they report a post
export function ReasonsPanel()
{
  const { toast, confirm } = useUi();
  const { list, error, reload } = useAdminList(getReasons);
  const [label, setLabel] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd(e)
  {
    e.preventDefault();
    if(label.trim().length < 3) return setFormError("A reason needs at least 3 characters.");

    setBusy(true);
    setFormError("");
    try
    {
      await admin.addReason(label.trim());
      setLabel("");
      toast("Reason added");
      reload();
    }
    catch(err)
    {
      setFormError(err.message);
    }
    finally
    {
      setBusy(false);
    }
  }

  async function handleDelete(reason)
  {
    const ok = await confirm({
      title: `Remove "${reason.label}"?`,
      message: "People won't be able to choose it anymore. Existing reports keep their reason.",
      confirmLabel: "Remove",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await admin.deleteReason(reason._id);
      toast("Reason removed");
      reload();
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  if(error) return <p className="error-box" role="alert">{error}</p>;

  return(
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <section className="card">
        <h2 className="font-heading text-ink mb-3">Current reasons</h2>
        {!list && <p className="text-sm text-muted">Loading…</p>}
        <ul className="divide-y divide-[var(--border)]">
          {(list || []).map((r) =>(
            <li key={r._id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-ink">{r.label}</span>
              <button type="button" className="text-xs text-muted hover:text-danger" onClick={() => handleDelete(r)}>Remove</button>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleAdd} className="card space-y-3 self-start" noValidate>
        <h2 className="font-heading text-ink">Add a reason</h2>
        <div>
          <label htmlFor="reason-label" className="label">Reason</label>
          <input id="reason-label" className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="e.g. Violence" />
        </div>
        {formError && <p className="error-box" role="alert">{formError}</p>}
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>{busy ? "Adding…" : "Add reason"}</button>
      </form>
    </div>
  );
}

//people asking for the verified tick
export function VerificationsPanel({ onChange })
{
  const { toast } = useUi();
  const { list, error, reload } = useAdminList(admin.verifications);

  async function review(entry, approve)
  {
    try
    {
      await admin.reviewVerification(entry.user._id, approve);
      toast(approve ? `${entry.user.username} is now verified` : "Request denied");
      reload();
      onChange();
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  if(error) return <p className="error-box" role="alert">{error}</p>;
  if(!list) return <div className="skeleton h-32" />;
  if(!list.length) return <p className="card text-center text-muted py-10">No verification requests right now.</p>;

  return(
    <ul className="space-y-3">
      {list.map((entry) =>(
        <li key={entry.user._id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar user={entry.user} size="md" />
            <div className="min-w-0">
              <UserName user={entry.user} />
              <p className="text-xs text-muted">Asked {timeAgo(entry.requestedAt)}</p>
            </div>
          </div>
          <p className="text-xs text-muted">
            {entry.progress.days} days old · {entry.progress.posts} posts · {entry.progress.comments} comments
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-primary btn-sm" onClick={() => review(entry, true)}>Approve</button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => review(entry, false)}>Deny</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
