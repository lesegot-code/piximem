// Student Number: u25143230
import { useEffect, useState } from "react";
import { getReasons, reportPost } from "../api.js";
import Modal from "./Modal.jsx";

//reasons come from the database, only admins can add new ones
export default function ReportModal({ post, onClose, onReported })
{
  const [reasons, setReasons] = useState(null);
  const [reasonId, setReasonId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() =>
  {
    let cancelled = false;
    getReasons()
      .then((list) => { if(!cancelled) setReasons(list); })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, []);

  async function handleSubmit(e)
  {
    e.preventDefault();
    if(!reasonId) return setError("Choose a reason first.");

    setBusy(true);
    setError("");
    try
    {
      await reportPost(post._id, reasonId);
      onReported();
    }
    catch(err)
    {
      setError(err.message);
      setBusy(false);
    }
  }

  return(
    <Modal title="Report this post" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted">
          Reports are anonymous. A post reported by 3 people is hidden until a moderator reviews it.
        </p>

        <fieldset>
          <legend className="label">Why are you reporting it?</legend>
          {!reasons && !error && <p className="text-sm text-muted">Loading reasons…</p>}
          <div className="space-y-2 mt-1">
            {(reasons || []).map((r) =>(
              <label
                key={r._id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer text-sm transition ${
                  reasonId === r._id ? "border-pixblue bg-pixblue/10 text-ink" : "border-border text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r._id}
                  checked={reasonId === r._id}
                  onChange={() => { setReasonId(r._id); setError(""); }}
                  className="accent-[#3B82F6]"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="error-box" role="alert">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
          <button type="submit" disabled={busy || !reasons} className="btn-primary btn-sm">
            {busy ? "Sending…" : "Send report"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
