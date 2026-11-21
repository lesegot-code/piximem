// Student Number: u25143230
import { Link } from "react-router-dom";

export function VerifiedBadge({ className = "" })
{
  return(
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-pixblue text-white text-[10px] leading-none shrink-0 ${className}`}
      title="Verified account"
      aria-label="Verified account"
    >
      ✓
    </span>
  );
}

//display name + verified tick, optionally linking to the profile
export default function UserName({ user, link = true, showHandle = false, className = "" })
{
  if(!user) return <span className="text-muted">Deleted user</span>;

  const content =(
    <>
      <span className="truncate">{user.name || user.username}</span>
      {user.verified && <VerifiedBadge />}
      {showHandle && user.name && user.name !== user.username &&(
        <span className="text-muted font-normal text-sm truncate">@{user.username}</span>
      )}
    </>
  );

  const classes = `inline-flex items-center gap-1 min-w-0 font-medium text-ink ${className}`;

  return link
    ? <Link to={`/profile/${user._id}`} className={`${classes} hover:text-pixblue`}>{content}</Link>
    : <span className={classes}>{content}</span>;
}
