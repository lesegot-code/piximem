// Student Number: u25143230
import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import UserName from "./UserName.jsx";
import HashtagList from "./HashtagList.jsx";
import { timeAgo, fullDate, plural } from "../utils/format.js";

//shown instead of a post that was reported more than twice
export function HiddenNotice({ count, onShow })
{
  return(
    <div className="card text-center py-8">
      <p className="text-ink font-medium mb-1">This post is hidden</p>
      <p className="text-muted text-sm mb-3">
        It was reported {plural(count, "time")} and is waiting for a moderator.
      </p>
      <button type="button" onClick={onShow} className="btn-secondary btn-sm">
        Show it anyway
      </button>
    </div>
  );
}

function FavouriteTag()
{
  return(
    <span className="text-xs text-pixamber font-medium" title="You marked this friend as a favourite">
      ★ Favourite
    </span>
  );
}

//a post in the activity feed or search results
export default function PostCard({ post, favourite = false, previewComments = 2 })
{
  const [revealed, setRevealed] = useState(false);

  if(post.hidden && !revealed)
  {
    return <HiddenNotice count={post.reportCount} onShow={() => setRevealed(true)} />;
  }

  //only the newest few comments, the rest are on the post page
  const comments = post.comments.slice(-previewComments);
  const caption = post.caption.length > 50 ? `${post.caption.slice(0, 50)}…` : post.caption;

  return(
    <article className="card">
      <header className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.author?._id}`} aria-label={`${post.author?.username}'s profile`}>
          <Avatar user={post.author} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <UserName user={post.author} />
          <p className="text-xs text-muted">
            <time dateTime={post.createdAt} title={fullDate(post.createdAt)}>{timeAgo(post.createdAt)}</time>
          </p>
        </div>
        {favourite && <FavouriteTag />}
      </header>

      <Link to={`/post/${post._id}`} className="block -mx-4 bg-bg overflow-hidden">
        <img
          src={post.imageUrl}
          alt={caption}
          className="w-full max-h-[34rem] object-cover"
          loading="lazy"
        />
      </Link>

      <div className="mt-3 space-y-2">
        <p className="text-ink text-sm whitespace-pre-wrap">{post.caption}</p>
        <HashtagList tags={post.hashtags} />
      </div>

      <footer className="mt-3 flex items-center justify-between text-sm text-muted border-t border-border pt-3">
        <span>{plural(post.commentCount, "comment")}</span>
        <Link to={`/post/${post._id}`} className="link">
          {post.commentCount > comments.length ? "View all comments" : "Open post"}
        </Link>
      </footer>

      {comments.length > 0 &&(
        <ul className="mt-3 space-y-1 text-sm">
          {comments.map((c) =>(
            <li key={c._id} className="min-w-0">
              <span className="font-medium text-ink">{c.author?.username}</span>{" "}
              <span className="text-muted break-words">{c.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

//"[user] created the album X" / "[user] added 2 photos to the album X"
export function AlbumActivityCard({ item })
{
  const { user, album, photos = [], photoCount, favourite } = item;
  const action = item.type === "album_created"
    ? "created the album"
    : `added ${plural(photoCount, "photo")} to the album`;

  return(
    <article className="card">
      <header className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${user?._id}`} aria-label={`${user?.username}'s profile`}>
          <Avatar user={user} size="md" />
        </Link>
        <div className="flex-1 min-w-0 text-sm">
          <p className="text-ink">
            <UserName user={user} /> <span className="text-muted">{action}</span>{" "}
            <Link to={`/album/${album._id}`} className="link">{album.name}</Link>
          </p>
          <p className="text-xs text-muted">
            <time dateTime={item.createdAt} title={fullDate(item.createdAt)}>{timeAgo(item.createdAt)}</time>
          </p>
        </div>
        {favourite && <FavouriteTag />}
      </header>

      {photos.length > 0 &&(
        <div className={`grid gap-1 -mx-4 ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {photos.map((p, i) =>(
            <Link
              key={p._id}
              to={`/post/${p._id}`}
              className={`relative block bg-bg overflow-hidden ${
                photos.length === 1 ? "aspect-[16/10]" : photos.length === 3 && i === 0 ? "row-span-2" : "aspect-square"
              }`}
            >
              <img
                src={p.imageUrl}
                alt={p.caption.slice(0, 60)}
                className={`w-full h-full object-cover ${p.hidden ? "blur-xl scale-110" : ""}`}
                loading="lazy"
              />
              {p.hidden &&(
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium bg-black/40">
                  Hidden after reports
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-2">
        {album.description && <p className="text-sm text-muted">{album.description}</p>}
        <HashtagList tags={album.hashtags} />
      </div>

      <footer className="mt-3 flex items-center justify-between text-sm text-muted border-t border-border pt-3">
        <span>{plural(album.postCount, "photo")} in this album</span>
        <Link to={`/album/${album._id}`} className="link">Open album</Link>
      </footer>
    </article>
  );
}
