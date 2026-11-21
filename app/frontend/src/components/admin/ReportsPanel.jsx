// Student Number: u25143230
import { Link } from "react-router-dom";
import { admin, deletePost } from "../../api.js";
import { useUi } from "../../context/UiContext.jsx";
import { useAdminList } from "./useAdminList.js";
import UserName from "../UserName.jsx";
import { plural, timeAgo } from "../../utils/format.js";

//every reported post with its reasons; keep it (clear reports) or delete it
export default function ReportsPanel({ onChange })
{
  const { toast, confirm } = useUi();
  const { list, error, reload } = useAdminList(admin.reports);

  async function keep(post)
  {
    const ok = await confirm({
      title: "Keep this post?",
      message: "Its reports are cleared and it shows in the feed again. The reports count as dismissed for the people who sent them.",
      confirmLabel: "Keep post",
    });
    if(!ok) return;

    try
    {
      await admin.dismissReports(post._id);
      toast("Reports dismissed, the post is visible again");
      reload();
      onChange();
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function remove(post)
  {
    const topReason = Object.entries(post.reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const ok = await confirm({
      title: "Delete this post?",
      message: `${post.author?.username} will be told it was removed (reason: ${topReason}). Its comments are deleted too.`,
      confirmLabel: "Delete post",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await deletePost(post._id, topReason);
      toast("Post deleted and the owner was notified");
      reload();
      onChange();
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  if(error) return <p className="error-box" role="alert">{error}</p>;
  if(!list) return <div className="skeleton h-48" />;
  if(!list.length) return <p className="card text-center text-muted py-10">No reported posts. Nice and quiet.</p>;

  return(
    <ul className="space-y-4">
      {list.map((post) =>(
        <li key={post._id} className="card flex flex-col sm:flex-row gap-4">
          <Link to={`/post/${post._id}`} className="sm:w-40 shrink-0 aspect-square rounded-lg overflow-hidden bg-bg border border-border">
            <img src={post.imageUrl} alt={post.caption.slice(0, 60)} className="w-full h-full object-cover" />
          </Link>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <UserName user={post.author} />
              <span className="text-muted">· {timeAgo(post.createdAt)}</span>
              <span className={`ml-auto text-xs font-medium rounded-full px-2 py-0.5 ${post.hidden ? "bg-red-500/15 text-danger" : "bg-pixamber/15 text-pixamber"}`}>
                {plural(post.reportCount, "report")}{post.hidden ? " · hidden" : ""}
              </span>
            </div>
            <p className="text-sm text-ink line-clamp-2">{post.caption}</p>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(post.reasonCounts).map(([reason, count]) =>(
                <span key={reason} className="chip py-0.5 text-xs">{reason} ×{count}</span>
              ))}
            </div>

            <details className="text-xs text-muted">
              <summary className="cursor-pointer hover:text-ink">Who reported it</summary>
              <ul className="mt-2 space-y-1">
                {post.reports.map((r) =>(
                  <li key={r._id}>
                    {r.reporter?.username || "Deleted user"}: {r.reason} ({timeAgo(r.createdAt)})
                  </li>
                ))}
              </ul>
            </details>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="btn-secondary btn-sm" onClick={() => keep(post)}>Keep post</button>
              <button type="button" className="btn-danger btn-sm" onClick={() => remove(post)}>Delete post</button>
              <Link to={`/post/${post._id}`} className="btn-secondary btn-sm">Open</Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
