// Student Number: u25143230
import { Link } from "react-router-dom";
import { buildImageUrl } from "../api.js";

export default function AlbumPreview({ album, postImages = [] })
{
  const covers = postImages.slice(0, 3);
  const hasCovers = covers.length > 0;

  return(
    <Link
      to={`/home?album=${album._id}`}
      className="card p-0 overflow-hidden block group"
      aria-label={`Open album ${album.name}`}
    >
      {/* stacked cover */}
      <div className="relative aspect-square bg-bg overflow-hidden">
        {hasCovers && covers.map((src, i) =>
        {
          const offsets = ["inset-0", "inset-2", "inset-4"];
          const opacities = ["opacity-100", "opacity-70", "opacity-40"];
          return(
            <img
              key={i}
              src={buildImageUrl(src) || src}
              alt=""
              className={`absolute ${offsets[i]} ${opacities[i]} w-full h-full object-cover rounded-lg transition group-hover:scale-105`}
            />
          );
        })}

        {!hasCovers &&(
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            No photos yet
          </div>
        )}

        {/* count badge */}
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
          {album.posts?.length || 0} photos
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-heading text-ink text-sm truncate">{album.name}</h3>
        {album.description &&(
          <p className="text-xs text-muted line-clamp-1 mt-0.5">
            {album.description}
          </p>
        )}
        {album.hashtags?.length > 0 &&(
          <div className="mt-1 flex flex-wrap gap-1 text-xs text-pixblue">
            {album.hashtags.slice(0, 3).map((t, i) =>(
              <span key={i}>{t.startsWith("#") ? t : `#${t}`}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}