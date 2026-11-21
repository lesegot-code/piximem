// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUi } from "../context/UiContext.jsx";
import { getAlbum, getProfile, deleteAlbum, addPostsToAlbum, removePostFromAlbum } from "../api.js";
import Avatar from "../components/Avatar.jsx";
import UserName from "../components/UserName.jsx";
import HashtagList from "../components/HashtagList.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import PostPicker from "../components/PostPicker.jsx";
import AlbumForm from "../components/AlbumForm.jsx";
import Modal from "../components/Modal.jsx";
import { fullDate, plural, timeAgo } from "../utils/format.js";

//pick more of the owner's photos to add
function AddPhotosModal({ album, onClose, onAdded })
{
  const [posts, setPosts] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() =>
  {
    let cancelled = false;
    getProfile(album.owner._id)
      .then((p) =>
      {
        if(cancelled) return;
        const inAlbum = album.posts.map((x) => x._id);
        setPosts((p.posts || []).filter((x) => !inAlbum.includes(x._id)));
      })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, [album]);

  async function handleAdd()
  {
    if(!selected.length) return setError("Select at least one photo.");
    setBusy(true);
    try
    {
      const { added } = await addPostsToAlbum(album._id, selected);
      onAdded(added);
    }
    catch(err)
    {
      setError(err.message);
      setBusy(false);
    }
  }

  return(
    <Modal title={`Add photos to ${album.name}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {!posts && !error && <p className="text-sm text-muted">Loading photos…</p>}
        {posts && posts.length === 0 && <p className="text-sm text-muted">All of your photos are already in this album.</p>}
        {posts && posts.length > 0 && <PostPicker posts={posts} selected={selected} onChange={setSelected} />}
        <p className="text-xs text-muted">Want a friend's photo in here? Open it and use "Save to album".</p>
        {error && <p className="error-box" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={busy || !posts?.length} onClick={handleAdd}>
            {busy ? "Adding…" : selected.length ? `Add ${plural(selected.length, "photo")}` : "Add photos"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AlbumPage()
{
  const { id } = useParams();
  const { toast, confirm } = useUi();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // "edit" | "add"
  const [reload, setReload] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;
    getAlbum(id)
      .then((a) => { if(!cancelled) { setAlbum(a); setError(""); } })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, [id, reload]);

  const refresh = () => setReload((n) => n + 1);

  async function handleDelete()
  {
    const ok = await confirm({
      title: `Delete "${album.name}"?`,
      message: "Only the album is deleted. The photos inside it stay on their owners' profiles.",
      confirmLabel: "Delete album",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await deleteAlbum(album._id);
      toast("Album deleted");
      navigate(`/profile/${album.owner._id}?tab=albums`);
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function handleRemove(post)
  {
    const ok = await confirm({
      title: "Remove from album?",
      message: "The photo stays on the profile, it just leaves this album.",
      confirmLabel: "Remove",
    });
    if(!ok) return;

    try
    {
      await removePostFromAlbum(album._id, post._id);
      toast("Removed from the album");
      refresh();
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

  if(!album || album._id !== id) return <div className="skeleton h-72" aria-label="Loading album" />;

  return(
    <div className="space-y-6">
      <section className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs text-muted">Album · {plural(album.posts.length, "photo")}</p>
            <h1 className="font-heading text-2xl md:text-3xl text-ink break-words">{album.name}</h1>
            {album.description && <p className="text-muted whitespace-pre-wrap">{album.description}</p>}
            <HashtagList tags={album.hashtags} pills />
          </div>

          {album.canManage &&(
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-primary btn-sm" onClick={() => setModal("add")}>+ Add photos</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setModal("edit")}>Edit details</button>
              <button type="button" className="btn-danger btn-sm" onClick={handleDelete}>Delete album</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-border text-sm">
          <Link to={`/profile/${album.owner?._id}`} aria-label={`${album.owner?.username}'s profile`}>
            <Avatar user={album.owner} size="sm" />
          </Link>
          <div className="min-w-0">
            <UserName user={album.owner} />
            <p className="text-xs text-muted">
              Created <time dateTime={album.createdAt} title={fullDate(album.createdAt)}>{timeAgo(album.createdAt)}</time>
              {album.updatedAt && album.updatedAt !== album.createdAt && ` · updated ${timeAgo(album.updatedAt)}`}
            </p>
          </div>
        </div>
      </section>

      <PhotoGrid
        posts={album.posts}
        emptyText={album.canManage ? "This album is empty. Use \"Add photos\" to fill it." : "This album is empty."}
        onRemove={album.canManage ? handleRemove : undefined}
      />

      {modal === "edit" &&(
        <Modal title="Edit album" onClose={() => setModal(null)} size="lg">
          <AlbumForm
            album={album}
            albumPosts={album.posts}
            onCancel={() => setModal(null)}
            onDone={() =>
            {
              setModal(null);
              toast("Album updated");
              refresh();
            }}
          />
        </Modal>
      )}

      {modal === "add" &&(
        <AddPhotosModal
          album={album}
          onClose={() => setModal(null)}
          onAdded={(count) =>
          {
            setModal(null);
            toast(`Added ${plural(count, "photo")}`);
            refresh();
          }}
        />
      )}
    </div>
  );
}
