// Student Number: 25143230
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";

//turns "#nature" into a clickable link
function HashtagText({ tag })
{
  const clean = tag.startsWith("#") ? tag.slice(1) : tag;
  return(
    <Link to={`/home?q=%23${encodeURIComponent(clean)}`} className="hashtag-text">
      #{clean}
    </Link>
  );
}

//a single image inside the preview
function PreviewImage({ src, alt })
{
  return(
    <div className="aspect-video bg-bg overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default function PostPreview({ post, author, previewComments = 2 })
{
  // hide posts with more than 2 reports from the feed
  const reportCount = (post.reports || []).length;
  const isHidden = reportCount > 2;

  if(isHidden)
  {
    return(
      <article className="card text-center">
        <p className="text-muted text-sm mb-2">
          This post was reported {reportCount} times and has been hidden.
        </p>
        <Link to={`/post/${post._id}`} className="text-pixblue text-sm font-medium hover:underline">
          View post anyway
        </Link>
      </article>
    );
  }

  const images = post.images || (post.imageUrl ? [post.imageUrl] : []);
  const comments = (post.comments || []).slice(-previewComments);

  return(
    <article className="card">
      {/* header: author + time */}
      <header className="flex items-center gap-3 mb-3">
        <Link to={`/profile/${post.userId}`}>
          <Avatar name={author?.username || "User"} avatarUrl={author?.avatar} size={40} />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.userId}`} className="font-medium text-ink hover:text-pixblue">
            {author?.username || "Unknown user"}
          </Link>
          <p className="text-xs text-muted">
            {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </header>

      {/* images */}
      {images.length === 1 &&(
        <PreviewImage src={images[0]} alt={`Photo by ${author?.username || "user"}`} />
      )}

      {images.length >= 2 &&(
        <div className="grid grid-cols-2 gap-1">
          <PreviewImage src={images[0]} alt="Photo 1" />
          <PreviewImage src={images[1]} alt="Photo 2" />
        </div>
      )}

      {/* caption + hashtags */}
      <div className="mt-3">
        <p className="text-ink text-sm whitespace-pre-wrap">{post.caption}</p>
        {post.hashtags && post.hashtags.length > 0 &&(
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {post.hashtags.map((tag, i) =>(
              <HashtagText key={i} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* footer stats */}
      <footer className="mt-3 flex items-center justify-between text-sm text-muted border-t border-border pt-3">
        <div className="flex items-center gap-4">
          <span>{post.comments?.length || 0} comments</span>
          <span>{post.likes || 0} likes</span>
        </div>
        <Link to={`/post/${post._id}`} className="text-pixblue font-medium hover:underline">
          View post
        </Link>
      </footer>

      {/* preview of last 2 comments */}
      {comments.length > 0 &&(
        <ul className="mt-3 space-y-1 text-sm">
          {comments.map((c) =>(
            <li key={c._id || c.createdAt}>
              <span className="font-medium text-ink">{c.username || "user"}:</span>{" "}
              <span className="text-muted">{c.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}