// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import { getPost, deletePost } from "../api.js";
import Avatar from "../components/Avatar.jsx";
import UserName from "../components/UserName.jsx";
import HashtagList from "../components/HashtagList.jsx";
import Comments from "../components/Comments.jsx";
import Modal from "../components/Modal.jsx";
import PostForm from "../components/PostForm.jsx";
import ReportModal from "../components/ReportModal.jsx";
import SaveToAlbumModal from "../components/SaveToAlbumModal.jsx";
import { HiddenNotice } from "../components/PostCard.jsx";
import { fullDate, plural } from "../utils/format.js";

export default function PostPage()
{
  const { id } = useParams();
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // "edit" | "report" | "save"
  const [revealed, setRevealed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;
    getPost(id)
      .then((p) => { if(!cancelled) { setPost(p); setError(""); } })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, [id, reload]);

  async function handleDelete()
  {
    const byAdmin = post.canManage && !post.isOwner;
    const ok = await confirm({
      title: "Delete this post?",
      message: byAdmin
        ? "You're deleting someone else's post as a moderator. They will get a notification. Comments are deleted too."
        : "The photo and all its comments will be deleted. If it's the only photo in an album, that album is removed too.",
      confirmLabel: "Delete post",
      danger: true,
    });
    if(!ok) return;

    try
    {
      const { albumsRemoved } = await deletePost(post._id, byAdmin ? "It broke the community rules" : undefined);
      toast(albumsRemoved ? `Post deleted, along with ${plural(albumsRemoved, "empty album")}` : "Post deleted");
      navigate(byAdmin ? "/admin" : `/profile/${me._id}`);
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  if(error)
  {
    return(
      <div className="card text-center py-12 max-w-lg mx-auto space-y-3">
        <p className="text-ink font-medium">{error}</p>
        <Link to="/home" className="btn-secondary btn-sm">Back to the feed</Link>
      </div>
    );
  }

  if(!post || post._id !== id) return <div className="skeleton h-96" aria-label="Loading post" />;

  if(post.hidden && !revealed && !post.canManage)
  {
    return(
      <div className="max-w-lg mx-auto space-y-3">
        <HiddenNotice count={post.reportCount} onShow={() => setRevealed(true)} />
      </div>
    );
  }

  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button type="button" onClick={() => navigate(-1)} className="link text-sm">← Back</button>

        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => setModal("save")} className="btn-secondary btn-sm">Save to album</button>

          {post.canManage &&(
            <>
              <button type="button" onClick={() => setModal("edit")} className="btn-secondary btn-sm">Edit</button>
              <button type="button" onClick={handleDelete} className="btn-danger btn-sm">Delete</button>
            </>
          )}

          {!post.isOwner &&(
            post.hasReported
              ? <button type="button" disabled className="btn-secondary btn-sm">Reported</button>
              : <button type="button" onClick={() => setModal("report")} className="btn-secondary btn-sm">Report</button>
          )}
        </div>
      </div>

      {post.hidden &&(
        <p className="notice-box">
          This post was reported {plural(post.reportCount, "time")}, so it's hidden in the feed until a moderator reviews it.
        </p>
      )}
      {post.canManage && !post.isOwner && (
        <p className="text-xs text-muted">You're seeing moderator options because you're an admin.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            <img
              src={post.imageUrl}
              alt={post.caption.slice(0, 80)}
              className="w-full h-auto max-h-[75vh] object-contain bg-bg"
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 min-w-0">
          <article className="card space-y-3">
            <header className="flex items-center gap-3">
              <Link to={`/profile/${post.author?._id}`} aria-label={`${post.author?.username}'s profile`}>
                <Avatar user={post.author} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <UserName user={post.author} />
                <p className="text-xs text-muted"><time dateTime={post.createdAt}>{fullDate(post.createdAt)}</time></p>
              </div>
            </header>

            <p className="text-ink text-sm whitespace-pre-wrap break-words">{post.caption}</p>
            <HashtagList tags={post.hashtags} pills />

            {post.albums.length > 0 &&(
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted mb-1.5">In {post.albums.length > 1 ? "these albums" : "the album"}:</p>
                <div className="flex flex-wrap gap-2">
                  {post.albums.map((a) =>(
                    <Link key={a._id} to={`/album/${a._id}`} className="chip py-1 text-xs">▦ {a.name}</Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <div className="card">
            <Comments post={post} onChange={(updated) => setPost((p) => ({ ...p, ...updated }))} />
          </div>
        </div>
      </div>

      {modal === "edit" &&(
        <Modal title="Edit post" onClose={() => setModal(null)}>
          <PostForm
            post={post}
            onCancel={() => setModal(null)}
            onDone={(saved) =>
            {
              setPost((p) => ({ ...p, ...saved }));
              setModal(null);
              toast("Post updated");
            }}
          />
        </Modal>
      )}

      {modal === "report" &&(
        <ReportModal
          post={post}
          onClose={() => setModal(null)}
          onReported={() =>
          {
            setModal(null);
            setReload((n) => n + 1);
            toast("Thanks. A moderator will take a look.");
          }}
        />
      )}

      {modal === "save" &&(
        <SaveToAlbumModal
          post={post}
          onClose={() => setModal(null)}
          onSaved={(message) =>
          {
            setModal(null);
            setReload((n) => n + 1);
            toast(message);
          }}
        />
      )}
    </div>
  );
}
