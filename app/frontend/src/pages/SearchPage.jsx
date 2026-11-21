// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { search } from "../api.js";
import SearchInput from "../components/SearchInput.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import AlbumCard from "../components/AlbumCard.jsx";
import Avatar from "../components/Avatar.jsx";
import UserName from "../components/UserName.jsx";
import { plural } from "../utils/format.js";

const TABS = [
  { id: "all", label: "All" },
  { id: "users", label: "People" },
  { id: "posts", label: "Posts" },
  { id: "albums", label: "Albums" },
];

function Section({ title, count, children })
{
  return(
    <section className="space-y-3">
      <h2 className="font-heading text-ink">{title} <span className="text-muted text-sm font-normal">({count})</span></h2>
      {children}
    </section>
  );
}

export default function SearchPage()
{
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "all";
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() =>
  {
    if(!q.trim()) return undefined;

    let cancelled = false;
    search(q)
      .then((data) => { if(!cancelled) { setResults(data); setError(""); } })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, [q]);

  const isTag = q.startsWith("#");
  const current = results && results.query === q.trim() ? results : null;
  const counts = current ? { users: current.users.length, posts: current.posts.length, albums: current.albums.length } : {};
  const nothing = current && !counts.users && !counts.posts && !counts.albums;

  function setTab(id)
  {
    setParams((prev) =>
    {
      const next = new URLSearchParams(prev);
      if(id === "all") next.delete("tab");
      else next.set("tab", id);
      return next;
    }, { replace: true });
  }

  const users =(
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {current?.users.map((u) =>(
        <li key={u._id}>
          <Link to={`/profile/${u._id}`} className="card card-hover flex items-center gap-3">
            <Avatar user={u} size="md" />
            <span className="min-w-0">
              <UserName user={u} link={false} />
              <span className="block text-xs text-muted truncate">@{u.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const posts = <PhotoGrid posts={current?.posts || []} emptyText="No posts match." />;

  const albums =(
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {current?.albums.map((a) => <AlbumCard key={a._id} album={a} />)}
    </div>
  );

  return(
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="font-heading text-2xl text-ink">{isTag ? q : "Search"}</h1>
        <SearchInput key={q} initialValue={q} autoFocus={!q} />
        <p className="text-xs text-muted">
          Find people by name, username or email, posts by caption, albums by name or description, and anything by #hashtag.
          Small typos are fine.
        </p>
      </div>

      {!q.trim() && <p className="text-muted text-sm">Type something above to start searching.</p>}
      {q.trim() && error && <p className="error-box" role="alert">{error}</p>}
      {q.trim() && !current && !error && <div className="skeleton h-40" aria-label="Searching" />}

      {nothing &&(
        <div className="card text-center py-10">
          <p className="text-ink font-medium">Nothing found for "{q}"</p>
          <p className="text-sm text-muted mt-1">Try a shorter word or check the spelling.</p>
        </div>
      )}

      {current && !nothing &&(
        <>
          <div className="flex border-b border-border overflow-x-auto" role="tablist">
            {TABS.filter((t) => !(isTag && t.id === "users")).map((t) =>(
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`tab ${tab === t.id ? "tab-active" : ""}`}
              >
                {t.label}{t.id !== "all" && ` (${counts[t.id]})`}
              </button>
            ))}
          </div>

          {tab === "all" &&(
            <div className="space-y-8">
              {counts.users > 0 && <Section title="People" count={counts.users}>{users}</Section>}
              {counts.posts > 0 && <Section title="Posts" count={counts.posts}>{posts}</Section>}
              {counts.albums > 0 && <Section title="Albums" count={counts.albums}>{albums}</Section>}
            </div>
          )}
          {tab === "users" && (counts.users ? users : <p className="text-sm text-muted">No people match.</p>)}
          {tab === "posts" && posts}
          {tab === "albums" && (counts.albums ? albums : <p className="text-sm text-muted">No albums match.</p>)}

          <p className="text-xs text-muted">
            {plural(counts.users + counts.posts + counts.albums, "result")} for "{q}"
          </p>
        </>
      )}
    </div>
  );
}
