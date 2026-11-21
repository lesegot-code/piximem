// Student Number: u25143230
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import {
  getProfile, deleteUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  cancelFriendRequest, unfriend, toggleFavourite, requestVerification,
} from "../api.js";
import Avatar from "../components/Avatar.jsx";
import UserName, { VerifiedBadge } from "../components/UserName.jsx";
import Modal from "../components/Modal.jsx";
import EditProfileForm from "../components/EditProfileForm.jsx";
import AlbumForm from "../components/AlbumForm.jsx";
import AlbumCard from "../components/AlbumCard.jsx";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { plural } from "../utils/format.js";

const STATUS_TEXT = {
  friends: "Friends",
  "request-sent": "Friend request sent",
  "request-received": "Wants to be your friend",
  none: "Not friends yet",
};

function PersonRow({ person, children })
{
  return(
    <li className="flex items-center gap-2">
      <Link to={`/profile/${person._id}`} aria-label={`${person.username}'s profile`}>
        <Avatar user={person} size="sm" />
      </Link>
      <div className="flex-1 min-w-0 text-sm">
        <UserName user={person} />
        <p className="text-xs text-muted truncate">@{person.username}</p>
      </div>
      {children}
    </li>
  );
}

//what you need for the verified tick, and the button to ask for it
function VerificationCard({ data, user, onRequested })
{
  const { toast } = useUi();
  const [busy, setBusy] = useState(false);

  if(user.isAdmin) return null;

  if(user.verified)
  {
    return(
      <section className="card flex items-center gap-3 text-sm">
        <VerifiedBadge className="w-6 h-6 text-xs" />
        <p className="text-ink">Your account is verified.</p>
      </section>
    );
  }

  const { progress } = data;
  const pending = user.verification?.status === "pending";
  const denied = user.verification?.status === "denied";

  async function ask()
  {
    setBusy(true);
    try
    {
      await requestVerification();
      toast("Verification requested. An admin will review it.");
      onRequested();
    }
    catch(err)
    {
      toast(err.message, "error");
      setBusy(false);
    }
  }

  const steps = [
    [`Account older than ${progress.rules.days} days`, progress.days >= progress.rules.days, `${progress.days} days`],
    [`${progress.rules.posts} or more posts`, progress.posts >= progress.rules.posts, plural(progress.posts, "post")],
    [`${progress.rules.comments} or more comments`, progress.comments >= progress.rules.comments, plural(progress.comments, "comment")],
  ];

  return(
    <section className="card space-y-3" aria-labelledby="verify-heading">
      <h2 id="verify-heading" className="font-heading text-ink">Get verified</h2>
      <ul className="space-y-1.5 text-sm">
        {steps.map(([label, done, value]) =>(
          <li key={label} className="flex items-center gap-2">
            <span className={done ? "text-success" : "text-muted"} aria-hidden="true">{done ? "✓" : "○"}</span>
            <span className={done ? "text-ink" : "text-muted"}>{label}</span>
            <span className="ml-auto text-xs text-muted">{value}</span>
          </li>
        ))}
      </ul>
      {pending
        ? <p className="notice-box">Request sent. An admin will review it soon.</p>
        : (
          <>
            {denied && <p className="text-xs text-muted">Your last request wasn't approved. You can ask again.</p>}
            <button type="button" className="btn-primary btn-sm w-full" disabled={!progress.eligible || busy} onClick={ask}>
              {busy ? "Sending…" : progress.eligible ? "Request verification" : "Not eligible yet"}
            </button>
          </>
        )}
    </section>
  );
}

export default function ProfilePage()
{
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { user: me, refreshUser, logoutUser } = useAuth();
  const { toast, confirm, dataVersion } = useUi();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null); // "edit" | "album"
  const [reload, setReload] = useState(0);

  const tab = params.get("tab") === "albums" ? "albums" : "posts";

  useEffect(() =>
  {
    let cancelled = false;
    getProfile(id)
      .then((d) => { if(!cancelled) { setData(d); setError(""); } })
      .catch((err) => { if(!cancelled) { setError(err.message); setData(null); } });
    return() => { cancelled = true; };
  }, [id, reload, dataVersion]);

  const refresh = () => setReload((n) => n + 1);

  //runs a friend action, then reloads the profile
  async function act(fn, message)
  {
    setBusy(true);
    try
    {
      await fn(id);
      await refreshUser();
      refresh();
      if(message) toast(message);
    }
    catch(err)
    {
      toast(err.message, "error");
    }
    finally
    {
      setBusy(false);
    }
  }

  async function handleUnfriend()
  {
    const ok = await confirm({
      title: `Unfriend ${data.user.username}?`,
      message: "You'll stop seeing each other's posts in your friends feed and lose access to their full profile.",
      confirmLabel: "Unfriend",
      danger: true,
    });
    if(ok) act(unfriend, `You are no longer friends with ${data.user.username}`);
  }

  async function handleFavourite()
  {
    try
    {
      const { isFavourite } = await toggleFavourite(id);
      await refreshUser();
      refresh();
      toast(isFavourite ? `${data.user.username}'s posts will show first in your feed` : "Removed from favourites");
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function handleDeleteAccount()
  {
    const ok = await confirm({
      title: "Delete your account?",
      message: "Your profile, posts, albums and comments will be deleted forever. This can't be undone.",
      confirmLabel: "Delete my account",
      danger: true,
    });
    if(!ok) return;

    try
    {
      await deleteUser(me._id);
      await logoutUser();
      toast("Your account was deleted.");
      navigate("/");
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  async function respond(person, accept)
  {
    try
    {
      await (accept ? acceptFriendRequest : declineFriendRequest)(person._id);
      await refreshUser();
      refresh();
      toast(accept ? `You and ${person.username} are now friends` : "Request declined");
    }
    catch(err)
    {
      toast(err.message, "error");
    }
  }

  function setTab(next)
  {
    setParams(next === "posts" ? {} : { tab: next }, { replace: true });
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

  if(!data || data.user._id !== id) return <div className="skeleton h-72" aria-label="Loading profile" />;

  const { user, friendship, canSeeFull } = data;
  const isSelf = friendship === "self";
  const posts = data.posts || [];
  const albums = data.albums || [];

  return(
    <div className="space-y-6">
      {/* banner and header are grouped so the card can overlap the banner */}
      <div>
      <div className="h-28 md:h-40 rounded-card bg-pix-banner" aria-hidden="true" />

      <section className="card -mt-12 md:-mt-16 mx-2 md:mx-6 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <Avatar user={user} size="2xl" className="-mt-14 md:-mt-16 ring-4 ring-[var(--surface)]" />

          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl text-ink flex items-center gap-2 flex-wrap">
              {user.name || user.username}
              {user.verified && <VerifiedBadge className="w-5 h-5 text-xs" />}
              {user.isAdmin && <span className="text-xs font-body font-medium text-pixamber border border-pixamber/40 rounded-full px-2 py-0.5">Moderator</span>}
            </h1>
            <p className="text-muted text-sm">
              @{user.username}{user.pronouns && ` · ${user.pronouns}`}
            </p>

            {canSeeFull &&(
              <>
                {user.bio && <p className="text-ink mt-2 text-sm whitespace-pre-wrap">{user.bio}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted">
                  {user.location && <span>📍 {user.location}</span>}
                  {user.website &&(
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="link truncate max-w-[16rem]">
                      🔗 {user.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {user.createdAt && <span>Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>}
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span><strong className="text-ink">{posts.length}</strong> <span className="text-muted">posts</span></span>
                  <span><strong className="text-ink">{albums.length}</strong> <span className="text-muted">albums</span></span>
                  <span><strong className="text-ink">{data.friends.length}</strong> <span className="text-muted">friends</span></span>
                </div>
              </>
            )}
            {isSelf && <p className="text-xs text-muted mt-2">Only you can see your email: {user.email}</p>}
          </div>

          {/* actions depend on how you know this person */}
          <div className="flex gap-2 flex-wrap items-center">
            {isSelf &&(
              <>
                <button type="button" onClick={() => setModal("edit")} className="btn-secondary btn-sm">Edit profile</button>
                <button type="button" onClick={handleDeleteAccount} className="btn-danger btn-sm">Delete account</button>
              </>
            )}

            {!isSelf &&(
              <span className={`text-xs font-medium rounded-full px-3 py-1 border ${
                friendship === "friends" ? "text-success border-emerald-500/40" : "text-muted border-border"
              }`}>
                {friendship === "friends" ? "✓ " : ""}{STATUS_TEXT[friendship]}
              </span>
            )}

            {friendship === "none" &&(
              <button type="button" onClick={() => act(sendFriendRequest, `Friend request sent to ${user.username}`)} disabled={busy} className="btn-primary btn-sm">
                Add friend
              </button>
            )}

            {friendship === "request-sent" &&(
              <button type="button" onClick={() => act(cancelFriendRequest, "Friend request cancelled")} disabled={busy} className="btn-secondary btn-sm">
                Cancel request
              </button>
            )}

            {friendship === "request-received" &&(
              <>
                <button type="button" onClick={() => act(acceptFriendRequest, `You and ${user.username} are now friends`)} disabled={busy} className="btn-primary btn-sm">
                  Accept
                </button>
                <button type="button" onClick={() => act(declineFriendRequest, "Request declined")} disabled={busy} className="btn-secondary btn-sm">
                  Decline
                </button>
              </>
            )}

            {friendship === "friends" &&(
              <>
                <button
                  type="button"
                  onClick={handleFavourite}
                  aria-pressed={data.isFavourite}
                  className={`btn-secondary btn-sm ${data.isFavourite ? "text-pixamber border-pixamber/50" : ""}`}
                  title="Favourite friends show first in your feed"
                >
                  {data.isFavourite ? "★ Favourite" : "☆ Add to favourites"}
                </button>
                <button type="button" onClick={handleUnfriend} disabled={busy} className="btn-secondary btn-sm">
                  Unfriend
                </button>
              </>
            )}
          </div>
        </div>
      </section>
      </div>

      {!canSeeFull &&(
        <div className="card text-center py-10 space-y-1">
          <p className="text-ink font-medium">This profile is only visible to friends</p>
          <p className="text-sm text-muted">
            {friendship === "request-sent"
              ? `Once ${user.username} accepts your request you'll see their bio, posts, albums and friends.`
              : `Add ${user.username} as a friend to see their bio, posts, albums and friends.`}
          </p>
        </div>
      )}

      {canSeeFull &&(
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-2 border-b border-border">
              <div className="flex" role="tablist">
                <button type="button" role="tab" aria-selected={tab === "posts"} onClick={() => setTab("posts")} className={`tab ${tab === "posts" ? "tab-active" : ""}`}>
                  Posts ({posts.length})
                </button>
                <button type="button" role="tab" aria-selected={tab === "albums"} onClick={() => setTab("albums")} className={`tab ${tab === "albums" ? "tab-active" : ""}`}>
                  Albums ({albums.length})
                </button>
              </div>
              {isSelf && tab === "albums" &&(
                <button type="button" className="btn-primary btn-sm mb-1" onClick={() => setModal("album")}>+ New album</button>
              )}
            </div>

            {tab === "posts" &&(
              <PhotoGrid posts={posts} emptyText={isSelf ? "You haven't shared anything yet. Use \"Share a Memory\" to post your first photo." : "No posts yet."} />
            )}

            {tab === "albums" && albums.length === 0 &&(
              <p className="text-muted text-sm py-8 text-center">
                {isSelf ? "No albums yet. Group your photos with \"New album\", or save a friend's post from its page." : "No albums yet."}
              </p>
            )}

            {tab === "albums" && albums.length > 0 &&(
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {albums.map((a) => <AlbumCard key={a._id} album={a} />)}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            {isSelf && <VerificationCard data={data.verification ? { progress: data.verification } : null} user={user} onRequested={async() => { await refreshUser(); refresh(); }} />}

            {isSelf &&(
              <section className="card" aria-labelledby="requests-heading">
                <h2 id="requests-heading" className="font-heading text-ink mb-3">Friend requests ({data.requests.length})</h2>
                {data.requests.length === 0 && <p className="text-sm text-muted">No pending requests.</p>}
                <ul className="space-y-3">
                  {data.requests.map((p) =>(
                    <PersonRow key={p._id} person={p}>
                      <button type="button" onClick={() => respond(p, true)} className="btn-primary btn-sm text-xs px-2.5">Accept</button>
                      <button type="button" onClick={() => respond(p, false)} className="btn-secondary btn-sm text-xs px-2.5">Decline</button>
                    </PersonRow>
                  ))}
                </ul>
              </section>
            )}

            <section className="card" aria-labelledby="friends-heading">
              <h2 id="friends-heading" className="font-heading text-ink mb-3">Friends ({data.friends.length})</h2>
              {data.friends.length === 0 && <p className="text-sm text-muted">No friends yet.</p>}
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {data.friends.map((p) =>(
                  <PersonRow key={p._id} person={p}>
                    {isSelf && (me.favourites || []).includes(p._id) && <span className="text-pixamber text-sm" title="Favourite">★</span>}
                  </PersonRow>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      )}

      {modal === "edit" &&(
        <Modal title="Edit profile" onClose={() => setModal(null)} size="lg">
          <EditProfileForm
            user={user}
            onCancel={() => setModal(null)}
            onSaved={async() =>
            {
              setModal(null);
              await refreshUser();
              refresh();
              toast("Profile updated");
            }}
          />
        </Modal>
      )}

      {modal === "album" &&(
        <Modal title="New album" onClose={() => setModal(null)} size="lg">
          <AlbumForm
            myPosts={posts}
            onCancel={() => setModal(null)}
            onDone={(album) =>
            {
              setModal(null);
              toast(`Album "${album.name}" created`);
              navigate(`/album/${album._id}`);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
