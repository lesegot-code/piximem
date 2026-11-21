// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addPostsToAlbum, createAlbum, getMyAlbums } from "../api.js";
import { plural } from "../utils/format.js";
import Modal from "./Modal.jsx";

//add any post (yours or a friend's) to one of your albums, or start a new one
export default function SaveToAlbumModal({ post, onClose, onSaved })
{
  const [albums, setAlbums] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() =>
  {
    let cancelled = false;
    getMyAlbums()
      .then((list) => { if(!cancelled) setAlbums(list); })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, []);

  async function addTo(album)
  {
    setBusyId(album._id);
    setError("");
    try
    {
      await addPostsToAlbum(album._id, [post._id]);
      onSaved(`Added to ${album.name}`);
    }
    catch(err)
    {
      setError(err.message);
      setBusyId(null);
    }
  }

  async function handleCreate(e)
  {
    e.preventDefault();
    if(name.trim().length < 2) return setError("Give your new album a name of at least 2 characters.");

    setBusyId("new");
    setError("");
    try
    {
      //the new album starts with this post and borrows its hashtags
      await createAlbum({ name: name.trim(), description: "", hashtags: post.hashtags.slice(0, 3), postIds: [post._id] });
      onSaved(`Saved to your new album ${name.trim()}`);
    }
    catch(err)
    {
      setError(err.message);
      setBusyId(null);
    }
  }

  return(
    <Modal title="Save to an album" onClose={onClose} size="sm">
      <div className="space-y-4">
        {!albums && !error && <p className="text-sm text-muted">Loading your albums…</p>}

        {albums?.length > 0 &&(
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {albums.map((a) =>
            {
              const inside = (a.postIds || []).includes(post._id);
              return(
                <li key={a._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg border border-border shrink-0">
                    {a.covers[0] && <img src={a.covers[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink truncate">{a.name}</p>
                    <p className="text-xs text-muted">{plural(a.postCount, "photo")}</p>
                  </div>
                  {inside
                    ? <Link to={`/album/${a._id}`} className="text-xs text-success font-medium">Already in it</Link>
                    : (
                      <button type="button" className="btn-secondary btn-sm" disabled={busyId !== null} onClick={() => addTo(a)}>
                        {busyId === a._id ? "Adding…" : "Add"}
                      </button>
                    )}
                </li>
              );
            })}
          </ul>
        )}

        {albums?.length === 0 && <p className="text-sm text-muted">You don't have any albums yet. Start one below.</p>}

        <form onSubmit={handleCreate} className="pt-3 border-t border-border space-y-2" noValidate>
          <label htmlFor="new-album-name" className="label">New album</label>
          <div className="flex gap-2">
            <input
              id="new-album-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Album name"
              maxLength={60}
            />
            <button type="submit" className="btn-primary btn-sm shrink-0" disabled={busyId !== null}>
              {busyId === "new" ? "Creating…" : "Create"}
            </button>
          </div>
        </form>

        {error && <p className="error-box" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
