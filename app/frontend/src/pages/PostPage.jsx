// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getPost,
  getUser,
  deletePost,
  getAlbumsForPost,
  buildImageUrl,
} from "../api.js";
import Avatar from "../components/Avatar.jsx";
import Comments from "../components/Comments.jsx";
import EditPostForm from "../components/EditPostForm.jsx";
import ReportModal from "../components/ReportModal.jsx";

export default function PostPage()
{
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);

  async function loadPost()
  {
    setLoading(true);
    setError("");

    try
    {
      const p = await getPost(id);
      const a = await getUser(p.userId);
      const albumsContaining = await getAlbumsForPost(id);

      setPost(p);
      setAuthor(a);
      setAlbums(albumsContaining);
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setLoading(false);
    }
  }

  useEffect(() =>
  {
    loadPost();
  }, [id]);

  async function handleDelete()
  {
    if(!window.confirm("Delete this post? This cannot be undone.")) return;

    try
    {
      await deletePost(post._id);
      navigate("/home");
    }
    catch(err)
    {
      setError(err.message);
    }
  }

  // ----- render states -----

  if(loading) return <p className="text-muted text-center py-10">Loading post…</p>;
  if(error) return(
    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 max-w-xl mx-auto">
      {error}
    </p>
  );
  if(!post) return <p className="text-muted text-center py-10">Post not found.</p>;

  const isOwner = me._id === post.userId.toString();
  const reportCount = (post.reports || []).length;
  const hidden = reportCount > 2;

  const imageSrc = post.imageUrl || buildImageUrl(post.image);

  return(
    <div className="space-y-4">
      {/* back + actions row */}
      <div className="flex items-center justify-between gap-2">
        <Link to="/home" className="text-pixblue text-sm font-medium hover:underline">
          ← Back to feed
        </Link>

        <div className="flex gap-2 flex-wrap">
          {isOwner &&(
            <>
              <button onClick={() => setEditing((v) => !v)} className="btn-secondary text-sm">
                {editing ? "Cancel edit" : "Edit"}
              </button>
              <button
                onClick={handleDelete}
                className="btn-secondary text-sm text-red-400 border-red-500/30 hover:border-red-500"
              >
                Delete
              </button>
            </>
          )}

          {!isOwner &&(
            <button onClick={() => setReporting(true)} className="btn-secondary text-sm">
              Report
            </button>
          )}
        </div>
      </div>

      {/* hidden warning (only visible to owner/admin here) */}
      {hidden &&(
        <p className="text-amber-300 text-sm bg-pixamber/10 border border-pixamber/30 rounded-lg px-3 py-2">
          This post has been reported {reportCount} times.
        </p>
      )}

      {/* two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* image column */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            {imageSrc ?(
              <img
                src={imageSrc}
                alt={post.caption?.slice(0, 60) || "Post image"}
                className="w-full h-auto max-h-[70vh] object-contain bg-bg"
              />
            ) :(
              <div className="aspect-video bg-bg flex items-center justify-center text-muted">
                No image
              </div>
            )}
          </div>
        </div>

        {/* details column */}
        <div className="lg:col-span-2 space-y-4">
          {/* author header */}
          <div className="card">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${post.userId}`}>
                <Avatar name={author?.username} avatarUrl={author?.avatar} size={40} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${post.userId}`}
                  className="font-medium text-ink hover:text-pixblue"
                >
                  {author?.username || "Unknown user"}
                </Link>
                <p className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* caption */}
            <p className="text-ink text-sm whitespace-pre-wrap mt-3">
              {post.caption}
            </p>

            {/* hashtags */}
            {post.hashtags?.length > 0 &&(
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {post.hashtags.map((tag, i) =>(
                  <Link
                    key={i}
                    to={`/home?q=%23${encodeURIComponent(tag.startsWith("#") ? tag.slice(1) : tag)}`}
                    className="hashtag-text"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </Link>
                ))}
              </div>
            )}

            {/* albums containing this post */}
            {albums.length > 0 &&(
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted mb-1">In album{albums.length > 1 ? "s" : ""}:</p>
                <div className="flex flex-wrap gap-2">
                  {albums.map((a) =>(
                    <Link
                      key={a._id}
                      to={`/home?album=${a._id}`}
                      className="hashtag-pill text-xs"
                    >
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* edit form */}
          {editing &&(
            <EditPostForm
              post={post}
              onSaved={async () =>
              {
                setEditing(false);
                await loadPost();
              }}
              onCancel={() => setEditing(false)}
            />
          )}

          {/* comments */}
          <div className="card">
            <Comments post={post} onUpdated={loadPost} />
          </div>
        </div>
      </div>

      {/* report modal */}
      {reporting &&(
        <ReportModal
          post={post}
          onClose={() => setReporting(false)}
          onReported={loadPost}
        />
      )}
    </div>
  );
}
