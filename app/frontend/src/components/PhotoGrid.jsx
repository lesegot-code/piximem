// Student Number: u25143230
import { useState } from "react";
import { Link } from "react-router-dom";

const PAGE = 12;

//square photo grid that shows 12 at a time with "Show more"
export default function PhotoGrid({ posts, emptyText = "No photos yet.", onRemove, removeLabel = "Remove" })
{
  const [shown, setShown] = useState(PAGE);

  if(!posts.length) return <p className="text-muted text-sm py-8 text-center">{emptyText}</p>;

  return(
    <div className="space-y-4">
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {posts.slice(0, shown).map((p) =>(
          <li key={p._id} className="relative group">
            <Link
              to={`/post/${p._id}`}
              className="block relative aspect-square bg-bg rounded-lg overflow-hidden border border-border"
            >
              <img
                src={p.imageUrl}
                alt={p.caption.slice(0, 60)}
                className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${p.hidden ? "blur-lg" : ""}`}
                loading="lazy"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition flex items-end p-2">
                <span className="text-white text-xs line-clamp-2">{p.caption}</span>
              </span>
              {p.hidden &&(
                <span className="absolute top-2 left-2 text-[10px] font-medium bg-black/60 text-white rounded-full px-2 py-0.5">
                  Hidden
                </span>
              )}
            </Link>

            {onRemove &&(
              <button
                type="button"
                onClick={() => onRemove(p)}
                className="absolute top-2 right-2 btn-sm rounded-full bg-black/70 text-white text-xs font-medium hover:bg-red-600 transition"
                aria-label={`${removeLabel}: ${p.caption.slice(0, 40)}`}
              >
                {removeLabel}
              </button>
            )}
          </li>
        ))}
      </ul>

      {posts.length > shown &&(
        <div className="text-center">
          <button type="button" className="btn-secondary btn-sm" onClick={() => setShown((n) => n + PAGE)}>
            Show more ({posts.length - shown} left)
          </button>
        </div>
      )}
    </div>
  );
}
