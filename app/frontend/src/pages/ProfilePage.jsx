// Student Number: 25143230
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUser,
  getPosts,
  getAlbums,
  deleteUser,
  sendFriendRequest,
  acceptFriendRequest,
  unfriend,
} from "../api.js";
import Avatar from "../components/Avatar.jsx";
import EditProfileForm from "../components/EditProfileForm.jsx";
import AlbumPreview from "../components/AlbumPreview.jsx";
import { buildImageUrl } from "../api.js";

export default function ProfilePage()
{
  const { id } = useParams();
  const { user: me, logoutUser } = useAuth();
  const navigate = useNavigate();

  const isOwnProfile = me?._id === id;

  const [profile, setProfile] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("posts"); // "posts" | "albums"
  const [editing, setEditing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [friendsById, setFriendsById] = useState({});

  // load profile + posts + albums
  async function loadProfile()
  {
    setLoading(true);
    setError("");

    try
    {
      const [p, posts, allAlbums] = await Promise.all([
        getUser(id),
        getPosts(),
        getAlbums(),
      ]);

      setProfile(p);
      setAllPosts(posts);
      setAlbums(allAlbums.filter((a) => a.userId.toString() === id));
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
    let cancelled = false;

    async function loadFriends()
    {
      if(!profile || !(profile.friends || []).length) return;

      const map = {};
      for(const fid of profile.friends)
      {
        try
        {
          const u = await getUser(fid);
          map[fid] = u;
        }
        catch
        {
          //will fall back to id slice
        }
      }

      if(!cancelled) setFriendsById(map);
    }

    loadFriends();
    return() => { cancelled = true; };
  }, [profile]);

  useEffect(() =>
  {
    loadProfile();
  }, [id]);

  // posts owned by this user, newest first
  const userPosts = useMemo(() =>
  {
    return allPosts
      .filter((p) => p.userId.toString() === id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allPosts, id]);

  // friendship status between me and this profile
  const friendship = useMemo(() =>
  {
    if(!profile || !me) return { status: "none" };

    const amIFriend = (profile.friends || []).some((f) => f.toString() === me._id);
    if(amIFriend) return { status: "friends" };

    const iSentRequest = (profile.friendRequests || []).some((f) => f.toString() === me._id);
    if(iSentRequest) return { status: "request-sent" };

    const theySentRequest = (me.friendRequests || []).some((f) => f.toString() === profile._id);
    if(theySentRequest) return { status: "request-received" };

    return { status: "none" };
  }, [profile, me]);

  // only show friends list if friends or own profile
  const showFriends = isOwnProfile || friendship.status === "friends";

  // actions
  async function handleAddFriend()
  {
    setActionBusy(true);
    try
    {
      await sendFriendRequest(profile._id, me._id);
      await loadProfile();
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setActionBusy(false);
    }
  }

  async function handleAccept()
  {
    setActionBusy(true);
    try
    {
      await acceptFriendRequest(me._id, profile._id);
      // refresh own user in context
      const freshMe = await getUser(me._id);
      localStorage.setItem("piximem_user", JSON.stringify(freshMe));
      await loadProfile();
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setActionBusy(false);
    }
  }

  // async function handleUnfriend()
  // {
  //   if(!window.confirm("Remove this friend?")) return;
  //   setActionBusy(true);
  //   try
  //   {
  //     await unfriend(profile._id, me._id);
  //     await loadProfile();
  //   }
  //   catch(err)
  //   {
  //     setError(err.message);
  //   }
  //   finally
  //   {
  //     setActionBusy(false);
  //   }
  // }

  async function handleDecline()
  {
    setActionBusy(true);
    try
    {
      await declineFriendRequest(me._id, profile._id);
      await loadProfile();
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setActionBusy(false);
    }
  }

  async function handleDeleteProfile()
  {
    if(!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    try
    {
      await deleteUser(me._id);
      logoutUser();
      navigate("/");
    }
    catch(err)
    {
      setError(err.message);
    }
  }

  // ----- render -----

  if(loading) return <p className="text-muted text-center py-10">Loading profile…</p>;
  if(error) return(
    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 max-w-xl mx-auto">
      {error}
    </p>
  );
  if(!profile) return <p className="text-muted text-center py-10">Profile not found.</p>;

  return(
    <div className="space-y-6">
      {/* banner */}
      <div className="h-32 md:h-44 rounded-card bg-pix-banner" />

      {/* header card (avatar + info + action button) */}
      <div className="card -mt-16 mx-4 relative">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="mt-[-3rem] md:mt-0">
            <Avatar
              name={profile.username}
              avatarUrl={profile.avatar}
              size={96}
            />
          </div>

          <div className="flex-1">
            <h1 className="font-heading text-2xl text-ink">
              {profile.username}
            </h1>
            <p className="text-muted text-sm">{profile.email}</p>
            {profile.bio &&(
              <p className="text-ink mt-2 text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}

            {/* stats */}
            <div className="flex gap-4 mt-3 text-sm">
              <span><span className="font-semibold text-ink">{userPosts.length}</span> <span className="text-muted">posts</span></span>
              <span><span className="font-semibold text-ink">{albums.length}</span> <span className="text-muted">albums</span></span>
              <span><span className="font-semibold text-ink">{(profile.friends || []).length}</span> <span className="text-muted">friends</span></span>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex gap-2 flex-wrap">
            {isOwnProfile &&(
              <>
                <button onClick={() => setEditing((v) => !v)} className="btn-secondary">
                  {editing ? "Close editor" : "Edit profile"}
                </button>
                <button onClick={handleDeleteProfile} className="btn-secondary text-red-400 border-red-500/30 hover:border-red-500">
                  Delete account
                </button>
              </>
            )}

            {!isOwnProfile && friendship.status === "none" &&(
              <button onClick={handleAddFriend} disabled={actionBusy} className="btn-primary">
                Add friend
              </button>
            )}

            {!isOwnProfile && friendship.status === "request-sent" &&(
              <span className="text-sm text-muted">Friend request sent</span>
            )}

            {!isOwnProfile && friendship.status === "request-received" &&(
              <>
                <button onClick={handleAccept} disabled={actionBusy} className="btn-primary">
                  Accept request
                </button>
                <button onClick={handleDecline} disabled={actionBusy} className="btn-secondary">
                  Decline
                </button>
              </>
            )}

            {!isOwnProfile && friendship.status === "friends" &&(
              <button onClick={handleUnfriend} disabled={actionBusy} className="btn-secondary">
                Unfriend
              </button>
            )}
          </div>
        </div>
      </div>

      {/* edit form */}
      {editing &&(
        <EditProfileForm
          user={profile}
          onSaved={async () =>
          {
            setEditing(false);
            await loadProfile();
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* main grid: content + friends sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          {/* tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("posts")}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "posts"
                  ? "text-pixblue border-b-2 border-pixblue"
                  : "text-muted hover:text-ink"
              }`}
            >
              Posts ({userPosts.length})
            </button>
            <button
              onClick={() => setTab("albums")}
              className={`px-4 py-2 text-sm font-medium transition ${
                tab === "albums"
                  ? "text-pixblue border-b-2 border-pixblue"
                  : "text-muted hover:text-ink"
              }`}
            >
              Albums ({albums.length})
            </button>
          </div>

          {/* posts grid */}
          {tab === "posts" &&(
            userPosts.length === 0
              ? <p className="text-muted text-sm py-6 text-center">No posts yet.</p>
              : <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {userPosts.map((p) =>(
                    <a
                      key={p._id}
                      href={`/post/${p._id}`}
                      className="group relative aspect-square bg-bg rounded-lg overflow-hidden border border-border"
                    >
                      {p.imageUrl &&(
                        <img
                          src={p.imageUrl}
                          alt={p.caption?.slice(0, 40) || "Post"}
                          className="w-full h-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
                        <p className="text-white text-xs line-clamp-2">{p.caption}</p>
                      </div>
                    </a>
                  ))}
                </div>
          )}

          {/* albums grid */}
          {tab === "albums" &&(
            albums.length === 0
              ? <p className="text-muted text-sm py-6 text-center">No albums yet.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {albums.map((album) =>
                  {
                    const coverImages = (album.posts || [])
                      .map((pid) =>
                      {
                        const found = allPosts.find((p) => p._id.toString() === pid.toString());
                        return found ? (found.image || found.imageUrl) : null;
                      })
                      .filter(Boolean);

                    return(
                      <AlbumPreview
                        key={album._id}
                        album={album}
                        postImages={coverImages}
                      />
                    );
                  })}
                </div>
          )}
        </section>

        {/* friends sidebar */}
        {showFriends &&(
          <aside className="space-y-4">
            <div className="card">
              <h3 className="font-heading text-ink mb-3">
                Friends ({profile.friends?.length || 0})
              </h3>
              {(profile.friends || []).length === 0 &&(
                <p className="text-sm text-muted">No friends yet.</p>
              )}
              <ul className="space-y-2">
                {(profile.friends || []).slice(0, 10).map((fid) =>
                {
                  const friend = friendsById[fid];
                  const label = friend?.username || String(fid).slice(-4);

                  return(
                    <li key={fid}>
                      <a
                        href={`/profile/${fid}`}
                        className="flex items-center gap-2 text-sm text-ink hover:text-pixblue"
                      >
                        <Avatar name={label} avatarUrl={friend?.avatar} size={28} />
                        <span>{label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {isOwnProfile &&(
              <div className="card">
                <h3 className="font-heading text-ink mb-3">Friend requests</h3>
                {(profile.friendRequests || []).length === 0 &&(
                  <p className="text-sm text-muted">No pending requests.</p>
                )}
                <ul className="space-y-2 text-sm">
                  {(profile.friendRequests || []).map((fid) =>(
                    <li key={fid} className="flex items-center justify-between gap-2">
                      <span className="text-muted text-xs">Request from…</span>
                      <a href={`/profile/${fid}`} className="text-pixblue hover:underline">
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}