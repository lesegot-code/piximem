// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import { getFeed, getPeopleSuggestions, getTrendingHashtags, sendFriendRequest } from "../api.js";
import PostCard, { AlbumActivityCard } from "../components/PostCard.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Avatar from "../components/Avatar.jsx";
import UserName from "../components/UserName.jsx";
import { plural } from "../utils/format.js";

const SORTS = [
  { id: "newest", label: "Newest first" },
  { id: "commented", label: "Most commented" },
];

const RANGES = [
  { id: "all", label: "Any time" },
  { id: "day", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

function FeedSkeleton()
{
  return(
    <div className="space-y-4" aria-label="Loading feed">
      {[0, 1].map((i) => <div key={i} className="skeleton h-96" />)}
    </div>
  );
}

function PeopleYouMayKnow()
{
  const { toast } = useUi();
  const [people, setPeople] = useState([]);

  useEffect(() =>
  {
    let cancelled = false;
    getPeopleSuggestions().then((list) => { if(!cancelled) setPeople(list); }).catch(() => {});
    return() => { cancelled = true; };
  }, []);

  async function add(entry)
  {
    try
    {
      const { friendship } = await sendFriendRequest(entry.user._id);
      setPeople((list) => list.map((p) => (p.user._id === entry.user._id
        ? { ...p, requested: friendship === "request-sent", friends: friendship === "friends" }
        : p)));
      toast(friendship === "friends" ? `You and ${entry.user.username} are now friends` : `Friend request sent to ${entry.user.username}`);
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  if(!people.length) return null;

  return(
    <section className="card" aria-labelledby="people-heading">
      <h2 id="people-heading" className="font-heading text-ink mb-3">People you may know</h2>
      <ul className="space-y-3">
        {people.map((p) =>(
          <li key={p.user._id} className="flex items-center gap-3">
            <Link to={`/profile/${p.user._id}`} aria-label={`${p.user.username}'s profile`}>
              <Avatar user={p.user} size="sm" />
            </Link>
            <div className="flex-1 min-w-0 text-sm">
              <UserName user={p.user} />
              <p className="text-xs text-muted">
                {p.wantsYou ? "Wants to be your friend" : p.mutual ? plural(p.mutual, "mutual friend") : `@${p.user.username}`}
              </p>
            </div>
            {p.friends
              ? <span className="text-xs text-success">Friends</span>
              : p.requested
                ? <span className="text-xs text-muted">Requested</span>
                : (
                  <button type="button" onClick={() => add(p)} className="btn-secondary btn-sm text-xs">
                    {p.wantsYou ? "Accept" : "Add"}
                  </button>
                )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function HomePage()
{
  const { user } = useAuth();
  const { setComposeOpen, dataVersion } = useUi();
  const [params, setParams] = useSearchParams();

  //filters live in the url so the back button and refresh keep them
  const scope = params.get("feed") === "global" ? "global" : "local";
  const sort = params.get("sort") === "commented" ? "commented" : "newest";
  const range = RANGES.some((r) => r.id === params.get("range")) ? params.get("range") : "all";
  const tag = params.get("tag") || "";

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [trending, setTrending] = useState([]);
  const [retry, setRetry] = useState(0);

  function setFilter(key, value, fallback)
  {
    setParams((prev) =>
    {
      const next = new URLSearchParams(prev);
      if(!value || value === fallback) next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  }

  //first page whenever a filter changes (or a new post was shared)
  useEffect(() =>
  {
    let cancelled = false;

    getFeed({ scope, sort, range, tag, page: 1 })
      .then((data) =>
      {
        if(cancelled) return;
        setItems(data.items);
        setHasMore(data.hasMore);
        setTotal(data.total);
        setPage(1);
        setError("");
      })
      .catch((err) => { if(!cancelled) setError(err.message); })
      .finally(() => { if(!cancelled) setLoading(false); });

    return() => { cancelled = true; };
  }, [scope, sort, range, tag, dataVersion, retry]);

  useEffect(() =>
  {
    let cancelled = false;
    getTrendingHashtags().then((list) => { if(!cancelled) setTrending(list); }).catch(() => {});
    return() => { cancelled = true; };
  }, [dataVersion]);

  async function loadMore()
  {
    setLoadingMore(true);
    try
    {
      const data = await getFeed({ scope, sort, range, tag, page: page + 1 });
      setItems((list) => [...list, ...data.items]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setLoadingMore(false);
    }
  }

  const filtered = sort !== "newest" || range !== "all" || tag;

  return(
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4 min-w-0" aria-labelledby="feed-heading">
        <h1 id="feed-heading" className="sr-only">Activity feed</h1>
        <SearchInput className="lg:hidden" />

        {/* feed controls */}
        <div className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border overflow-hidden" role="group" aria-label="Which feed">
              {[["local", "Friends"], ["global", "Everyone"]].map(([id, label]) =>(
                <button
                  key={id}
                  type="button"
                  aria-pressed={scope === id}
                  onClick={() => { setLoading(true); setFilter("feed", id, "local"); }}
                  className={`px-4 py-1.5 text-sm font-medium transition ${
                    scope === id ? "bg-pixblue text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label htmlFor="feed-sort" className="sr-only">Sort the feed</label>
            <select
              id="feed-sort"
              value={sort}
              onChange={(e) => { setLoading(true); setFilter("sort", e.target.value, "newest"); }}
              className="input py-1.5 text-sm w-auto"
            >
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <label htmlFor="feed-range" className="sr-only">Time range</label>
            <select
              id="feed-range"
              value={range}
              onChange={(e) => { setLoading(true); setFilter("range", e.target.value, "all"); }}
              className="input py-1.5 text-sm w-auto"
            >
              {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>

          {tag &&(
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Only showing</span>
              <button
                type="button"
                className="chip chip-active py-1"
                onClick={() => { setLoading(true); setFilter("tag", ""); }}
                aria-label={`Stop filtering by ${tag}`}
              >
                {tag} <span aria-hidden="true">✕</span>
              </button>
            </div>
          )}

          <p className="text-xs text-muted">
            {scope === "local"
              ? "Posts and albums from you and your friends."
              : "Posts and albums from everyone on Pixel Memory."}
            {" "}Favourite friends always show first.
            {!loading && ` ${plural(total, "item")}.`}
          </p>
        </div>

        {loading && <FeedSkeleton />}

        {!loading && error &&(
          <div className="error-box flex items-center justify-between gap-3" role="alert">
            <span>{error}</span>
            <button type="button" className="link" onClick={() => { setLoading(true); setRetry((n) => n + 1); }}>Try again</button>
          </div>
        )}

        {!loading && !error && items.length === 0 &&(
          <div className="card text-center py-12 space-y-3">
            <p className="text-ink font-medium">
              {filtered ? "Nothing matches these filters." : scope === "local" ? "Your friends haven't shared anything yet." : "No memories here yet."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {filtered &&(
                <button type="button" className="btn-secondary btn-sm" onClick={() => { setLoading(true); setParams({ feed: scope }, { replace: true }); }}>
                  Clear filters
                </button>
              )}
              {scope === "local" &&(
                <button type="button" className="btn-secondary btn-sm" onClick={() => { setLoading(true); setFilter("feed", "global", "local"); }}>
                  See everyone's posts
                </button>
              )}
              <button type="button" className="btn-primary btn-sm" onClick={() => setComposeOpen(true)}>Share a Memory</button>
            </div>
          </div>
        )}

        {!loading && items.map((item, i) =>
          item.type === "post"
            ? <PostCard key={`p-${item.post._id}`} post={item.post} favourite={item.favourite} />
            : <AlbumActivityCard key={`a-${item.album._id}-${i}`} item={item} />
        )}

        {!loading && hasMore &&(
          <div className="text-center">
            <button type="button" onClick={loadMore} disabled={loadingMore} className="btn-secondary">
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 self-start" aria-label="Sidebar">
        <section className="card">
          <div className="flex items-center gap-3 mb-4">
            <Avatar user={user} size="lg" />
            <div className="min-w-0">
              <UserName user={user} />
              <p className="text-xs text-muted truncate">@{user.username}</p>
            </div>
          </div>
          <button type="button" onClick={() => setComposeOpen(true)} className="btn-primary w-full mb-2">
            Share a Memory
          </button>
          <Link to={`/profile/${user._id}?tab=albums`} className="btn-secondary w-full">
            My albums
          </Link>
        </section>

        {trending.length > 0 &&(
          <section className="card" aria-labelledby="trending-heading">
            <h2 id="trending-heading" className="font-heading text-ink mb-1">Trending hashtags</h2>
            <p className="text-xs text-muted mb-3">Tap one to filter your feed.</p>
            <div className="flex flex-wrap gap-2">
              {trending.map((t) =>(
                <button
                  key={t.tag}
                  type="button"
                  aria-pressed={tag === t.tag}
                  onClick={() => { setLoading(true); setFilter("tag", tag === t.tag ? "" : t.tag); }}
                  className={`chip py-1 ${tag === t.tag ? "chip-active" : ""}`}
                >
                  {t.tag} <span className="text-[10px] opacity-70">{t.count}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <PeopleYouMayKnow />
      </aside>
    </div>
  );
}
