// Student Number: u25143230
import { useState } from "react";
import { Link } from "react-router-dom";
import { admin, deleteAlbum, deletePost, getAlbum } from "../../api.js";
import { useUi } from "../../context/UiContext.jsx";
import { useAdminList } from "./useAdminList.js";
import UserName from "../UserName.jsx";
import Modal from "../Modal.jsx";
import PostForm from "../PostForm.jsx";
import AlbumForm from "../AlbumForm.jsx";
import { plural, timeAgo } from "../../utils/format.js";

function useFilter(list, fields)
{
  const [text, setText] = useState("");
  const needle = text.trim().toLowerCase();
  const shown = (list || []).filter((item) => !needle || fields(item).some((v) => v?.toLowerCase().includes(needle)));
  return { text, setText, shown };
}

//every post on the site: edit or delete any of them
export function PostsPanel({ onChange })
{
  const { toast, confirm } = useUi();
  const { list, error, reload } = useAdminList(admin.posts);
  const { text, setText, shown } = useFilter(list, (p) => [p.caption, p.author?.username, ...p.hashtags]);
  const [editing, setEditing] = useState(null);

  async function remove(post)
  {
    const ok = await confirm({
      title: "Delete this post?",
      message: `${post.author?.username} will get a notification that a moderator removed it.`,
      confirmLabel: "Delete post",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await deletePost(post._id, "Removed by a moderator");
      toast("Post deleted");
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

  return(
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="post-filter" className="sr-only">Filter posts</label>
        <input id="post-filter" className="input max-w-xs" placeholder="Filter by caption, user or #tag" value={text} onChange={(e) => setText(e.target.value)} />
        <span className="text-xs text-muted">{plural(shown.length, "post")}</span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((p) =>(
          <li key={p._id} className="card flex gap-3">
            <Link to={`/post/${p._id}`} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-bg border border-border">
              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </Link>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <UserName user={p.author} className="text-xs" />
                <span className="text-muted">{timeAgo(p.createdAt)}</span>
                {p.reportCount > 0 && <span className="text-pixamber">🚩 {p.reportCount}</span>}
              </div>
              <p className="text-sm text-ink line-clamp-2">{p.caption}</p>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setEditing(p)}>Edit</button>
                <button type="button" className="btn-danger btn-sm text-xs" onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing &&(
        <Modal title={`Edit ${editing.author?.username}'s post`} onClose={() => setEditing(null)}>
          <PostForm
            post={editing}
            onCancel={() => setEditing(null)}
            onDone={() =>
            {
              setEditing(null);
              toast("Post updated");
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}

//every album on the site: edit or delete any of them
export function AlbumsPanel({ onChange })
{
  const { toast, confirm } = useUi();
  const { list, error, reload } = useAdminList(admin.albums);
  const { text, setText, shown } = useFilter(list, (a) => [a.name, a.description, a.owner?.username]);
  const [editing, setEditing] = useState(null);

  async function startEdit(card)
  {
    try
    {
      setEditing(await getAlbum(card._id)); //full album so hashtag suggestions work
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function remove(album)
  {
    const ok = await confirm({
      title: `Delete "${album.name}"?`,
      message: "The album is removed. The photos in it are not deleted.",
      confirmLabel: "Delete album",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await deleteAlbum(album._id);
      toast("Album deleted");
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

  return(
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="album-filter" className="sr-only">Filter albums</label>
        <input id="album-filter" className="input max-w-xs" placeholder="Filter by name or owner" value={text} onChange={(e) => setText(e.target.value)} />
        <span className="text-xs text-muted">{plural(shown.length, "album")}</span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {shown.map((a) =>(
          <li key={a._id} className="card flex gap-3">
            <Link to={`/album/${a._id}`} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-bg border border-border">
              {a.covers[0] && <img src={a.covers[0]} alt="" className="w-full h-full object-cover" loading="lazy" />}
            </Link>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm text-ink font-medium truncate">{a.name}</p>
              <p className="text-xs text-muted">
                by <UserName user={a.owner} className="text-xs" /> · {plural(a.postCount, "photo")}
              </p>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => startEdit(a)}>Edit</button>
                <button type="button" className="btn-danger btn-sm text-xs" onClick={() => remove(a)}>Delete</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing &&(
        <Modal title={`Edit ${editing.owner?.username}'s album`} onClose={() => setEditing(null)} size="lg">
          <AlbumForm
            album={editing}
            albumPosts={editing.posts}
            onCancel={() => setEditing(null)}
            onDone={() =>
            {
              setEditing(null);
              toast("Album updated");
              reload();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
