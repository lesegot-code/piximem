// Student Number: u25143230
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getPosts, getAllUsers, getUser } from "../api.js";
import PostPreview from "../components/PostPreview.jsx";
import AddPostForm from "../components/AddPostForm.jsx";
import SearchInput from "../components/SearchInput.jsx";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Most commented" },
];

export default function HomePage()
{
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const composeOpen = searchParams.get("compose") === "1";

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [feedType, setFeedType] = useState("local"); // "local" | "global"
  const [sortBy, setSortBy] = useState("newest");

  // load everything once on mount
  useEffect(() =>
  {
    let cancelled = false;

    async function load()
    {
      setLoading(true);
      setError("");

      try
      {
        const [postList, userList] = await Promise.all([
          getPosts(),
          getAllUsers(),
        ]);

        if(cancelled) return;

        setPosts(postList);
        setUsers(userList);

        // fetch profile (for friends list)
        const own = await getUser(user._id);
        if(cancelled) return;
        setMe(own);
      }
      catch(err)
      {
        if(!cancelled) setError(err.message);
      }
      finally
      {
        if(!cancelled) setLoading(false);
      }
    }

    load();
    return() => { cancelled = true; };
  }, [user._id]);

  // map userId -> user object for fast lookups
  const usersById = useMemo(() =>
  {
    const map = {};
    for(const u of users) map[u._id] = u;
    return map;
  }, [users]);

  // filter posts by feed type, search query, and sort
  const visiblePosts = useMemo(() =>
  {
    let list = [...posts];

    // local feed = my friends + me
    if(feedType === "local" && me)
    {
      const myFriends = (me.friends || []).map((f) => f.toString());
      const allowed = new Set([user._id, ...myFriends]);
      list = list.filter((p) => allowed.has(p.userId.toString()));
    }

    // search filter
    if(q)
    {
      const needle = q.toLowerCase();

      if(needle.startsWith("#"))
      {
        const tag = needle.slice(1);
        list = list.filter((p) =>
          (p.hashtags || []).some((h) => h.toLowerCase().includes(tag))
        );
      }
      else
      {
        list = list.filter((p) =>
          p.caption?.toLowerCase().includes(needle)
        );
      }
    }

    // sort
    if(sortBy === "newest")
    {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    else if(sortBy === "popular")
    {
      list.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
    }

    return list;
  }, [posts, feedType, sortBy, q, me, user._id]);

  // when the user clicks "Share a Memory" in navbar
  function openCompose()
  {
    setSearchParams((prev) =>
    {
      const next = new URLSearchParams(prev);
      next.set("compose", "1");
      return next;
    });
  }

  function closeCompose()
  {
    setSearchParams((prev) =>
    {
      const next = new URLSearchParams(prev);
      next.delete("compose");
      return next;
    });
  }

  function handleCreated(newPost)
  {
    setPosts([newPost, ...posts]);
    closeCompose();
  }

  return(
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* main feed */}
      <section className="lg:col-span-2 space-y-4">
        {/* search + filters */}
        <div className="space-y-3">
          <SearchInput initialValue={q} />

          <div className="flex flex-wrap items-center gap-2">
            {/* feed switch */}
            <div className="inline-flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setFeedType("local")}
                className={`px-4 py-1.5 text-sm font-medium transition ${
                  feedType === "local"
                    ? "bg-pixblue text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                Local
              </button>
              <button
                onClick={() => setFeedType("global")}
                className={`px-4 py-1.5 text-sm font-medium transition ${
                  feedType === "global"
                    ? "bg-pixblue text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                Global
              </button>
            </div>

            {/* sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input py-1.5 text-sm w-auto"
              aria-label="Sort feed"
            >
              {SORTS.map((s) =>(
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            {/* clear search */}
            {q &&(
              <button
                onClick={() => setSearchParams({})}
                className="text-sm text-muted hover:text-ink"
              >
                ✕ Clear search
              </button>
            )}
          </div>

          {q &&(
            <p className="text-sm text-muted">
              Showing results for <span className="text-ink font-medium">"{q}"</span>
            </p>
          )}
        </div>

        {/* compose modal / inline form */}
        {composeOpen &&(
          <AddPostForm onCreated={handleCreated} onCancel={closeCompose} />
        )}

        {/* feed */}
        {loading &&(
          <p className="text-muted text-center py-8">Loading feed…</p>
        )}

        {!loading && error &&(
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {!loading && !error && visiblePosts.length === 0 &&(
          <div className="card text-center py-10">
            <p className="text-muted">
              {q
                ? "No posts match your search."
                : feedType === "local"
                  ? "Your friends haven't shared anything yet — be the first!"
                  : "No memories here yet."
              }
            </p>
          </div>
        )}

        {!loading && !error && visiblePosts.map((post) =>(
          <PostPreview
            key={post._id}
            post={post}
            author={usersById[post.userId] || usersById[post.userId?.toString()]}
          />
        ))}
      </section>

      {/* sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-24 self-start">
        <div className="card">
          <h3 className="font-heading text-ink mb-2">Quick actions</h3>
          <button onClick={openCompose} className="btn-primary w-full mb-2">
            Share a Memory
          </button>
          <a href={`/profile/${user._id}`} className="btn-secondary w-full block text-center">
            View my profile
          </a>
        </div>

        <div className="card">
          <h3 className="font-heading text-ink mb-2">Friends You May Know</h3>
          {users.length === 0 &&(
            <p className="text-sm text-muted">No users yet.</p>
          )}
          <ul className="space-y-2">
            {users
              .filter((u) => u._id !== user._id)
              .filter((u) => !(me?.friends || []).some((f) => f.toString() === u._id))
              .slice(0, 5)
              .map((u) =>(
                <li key={u._id}>
                  <a href={`/profile/${u._id}`} className="flex items-center gap-2 text-sm hover:text-pixblue">
                    <span className="w-8 h-8 rounded-full bg-pixblue/20 text-pixblue flex items-center justify-center font-semibold">
                      {u.username?.[0]?.toUpperCase() || "?"}
                    </span>
                    <span>{u.username || u.email}</span>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}