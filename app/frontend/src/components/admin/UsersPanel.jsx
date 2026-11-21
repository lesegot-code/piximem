// Student Number: u25143230
import { useState } from "react";
import { Link } from "react-router-dom";
import { admin, deleteUser, updateUser } from "../../api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useUi } from "../../context/UiContext.jsx";
import { useAdminList } from "./useAdminList.js";
import Avatar from "../Avatar.jsx";
import UserName from "../UserName.jsx";
import Modal from "../Modal.jsx";
import EditProfileForm from "../EditProfileForm.jsx";
import { plural } from "../../utils/format.js";

//all accounts: edit, delete, verify, and spot people abusing "report"
export default function UsersPanel({ rules, onChange })
{
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const { list, error, reload } = useAdminList(admin.users);
  const [filter, setFilter] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [editing, setEditing] = useState(null);

  async function run(action, message)
  {
    try
    {
      await action();
      toast(message);
      reload();
      onChange();
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function handleDelete(u)
  {
    const ok = await confirm({
      title: `Delete ${u.username}'s account?`,
      message: `This deletes their profile, ${plural(u.postCount, "post")}, ${plural(u.albumCount, "album")} and all their comments. It can't be undone.`,
      confirmLabel: "Delete account",
      danger: true,
    });
    if(ok) run(() => deleteUser(u._id), `${u.username}'s account was deleted`);
  }

  async function handleReporting(u)
  {
    const blocking = !u.reportingBlocked;
    const ok = await confirm({
      title: blocking ? `Pause reporting for ${u.username}?` : `Let ${u.username} report again?`,
      message: blocking
        ? "They can still use the site but won't be able to report posts. They get a notification explaining why."
        : "They'll be able to report posts again.",
      confirmLabel: blocking ? "Pause reporting" : "Allow reporting",
      danger: blocking,
    });
    if(ok) run(() => admin.setReporting(u._id, blocking), blocking ? "Reporting paused" : "Reporting allowed again");
  }

  if(error) return <p className="error-box" role="alert">{error}</p>;
  if(!list) return <div className="skeleton h-48" />;

  const needle = filter.trim().toLowerCase();
  const shown = list
    .filter((u) => !onlyFlagged || u.reportStats.flagged)
    .filter((u) => !needle || [u.username, u.name, u.email].some((v) => v?.toLowerCase().includes(needle)));
  const flaggedCount = list.filter((u) => u.reportStats.flagged).length;

  return(
    <div className="space-y-4">
      <div className="card text-sm text-muted space-y-1">
        <p className="text-ink font-medium">How report abuse is spotted</p>
        <p>
          Someone is flagged when at least {rules.minDismissed} of their reports were dismissed and that's {Math.round(rules.dismissedShare * 100)}% or more
          of their reviewed reports, or when they send {rules.perDay}+ reports in 24 hours. You can pause their reporting.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="user-filter" className="sr-only">Filter users</label>
        <input id="user-filter" className="input max-w-xs" placeholder="Filter by name or email" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button type="button" aria-pressed={onlyFlagged} className={`chip ${onlyFlagged ? "chip-active" : ""}`} onClick={() => setOnlyFlagged((v) => !v)}>
          🚩 Flagged ({flaggedCount})
        </button>
        <span className="text-xs text-muted">{plural(shown.length, "account")}</span>
      </div>

      <ul className="space-y-3">
        {shown.map((u) =>(
          <li key={u._id} className={`card ${u.reportStats.flagged ? "border-pixamber/60" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link to={`/profile/${u._id}`} aria-label={`${u.username}'s profile`}><Avatar user={u} size="md" /></Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserName user={u} />
                    {u.isAdmin && <span className="text-[10px] text-pixamber border border-pixamber/40 rounded-full px-1.5">Admin</span>}
                    {u.reportingBlocked && <span className="text-[10px] text-danger border border-red-500/40 rounded-full px-1.5">Reporting paused</span>}
                  </div>
                  <p className="text-xs text-muted truncate">@{u.username} · {u.email}</p>
                  <p className="text-xs text-muted">
                    {plural(u.postCount, "post")} · {plural(u.albumCount, "album")} · joined {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted md:text-right md:w-48">
                <p>Reports sent: {u.reportStats.made} ({u.reportStats.upheld} upheld, {u.reportStats.dismissed} dismissed)</p>
                {u.reportStats.flagged && <p className="text-pixamber font-medium mt-0.5">🚩 {u.reportStats.flagReasons.join(", ")}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(u)}>Edit</button>
                {!u.isAdmin &&(
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => run(() => updateUser(u._id, { verified: !u.verified }), u.verified ? "Verification removed" : `${u.username} is now verified`)}
                  >
                    {u.verified ? "Unverify" : "Verify"}
                  </button>
                )}
                {!u.isAdmin &&(
                  <button type="button" className="btn-secondary btn-sm" onClick={() => handleReporting(u)}>
                    {u.reportingBlocked ? "Allow reporting" : "Pause reporting"}
                  </button>
                )}
                {u._id !== me._id && <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing &&(
        <Modal title={`Edit ${editing.username}`} onClose={() => setEditing(null)} size="lg">
          <EditProfileForm
            user={editing}
            onCancel={() => setEditing(null)}
            onSaved={() =>
            {
              setEditing(null);
              toast("Account updated");
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
