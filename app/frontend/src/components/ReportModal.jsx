// Student Number: 25143230
import { useState } from "react";
import { reportPost } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Harassment or hate",
  "Copyright violation",
  "Other",
];

export default function ReportModal({ post, onClose, onReported })
{
  const { user } = useAuth();
  const [reason, setReason] = useState(REASONS[0]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e)
  {
    e.preventDefault();
    setBusy(true);
    setError("");

    try
    {
      await reportPost(post._id, user._id, reason);
      if(onReported) onReported();
      onClose();
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
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card max-w-sm w-full space-y-3"
      >
        <h2 className="font-heading text-lg text-ink">Report this post</h2>
        <p className="text-sm text-muted">
          Tell us why. Reports help keep Pixel Memory a safe place to share.
        </p>

        <div>
          <label htmlFor="report-reason" className="block text-sm text-muted mb-1">
            Reason
          </label>
          <select
            id="report-reason"
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) =>(
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {error &&(
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Reporting…" : "Report"}
          </button>
        </div>
      </form>
    </div>
  );
}