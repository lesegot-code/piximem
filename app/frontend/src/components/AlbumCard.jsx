// Student Number: u25143230
import { Link } from "react-router-dom";
import { plural } from "../utils/format.js";
import UserName from "./UserName.jsx";

//album preview with a stack of its first three photos
export default function AlbumCard({ album, showOwner = false })
{
  const covers = album.covers || [];

  return(
    <article className="card card-hover p-0 overflow-hidden relative">
      <Link to={`/album/${album._id}`} className="block" aria-label={`Open album ${album.name}`}>
        <div className="relative aspect-[4/3] bg-bg overflow-hidden">
          {covers.length === 0 &&(
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">No photos yet</div>
          )}

          {/* first photo big, the next two as a strip on the right */}
          {covers.length > 0 &&(
            <div className={`grid h-full gap-0.5 ${covers.length > 1 ? "grid-cols-3" : "grid-cols-1"}`}>
              <img src={covers[0]} alt="" className={`w-full h-full object-cover ${covers.length > 1 ? "col-span-2" : ""}`} loading="lazy" />
              {covers.length > 1 &&(
                <div className="grid grid-rows-2 gap-0.5 h-full">
                  {covers.slice(1, 3).map((src) =>(
                    <img key={src} src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ))}
                  {covers.length === 2 && <div className="bg-surface2" />}
                </div>
              )}
            </div>
          )}

          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {plural(album.postCount, "photo")}
          </span>
        </div>

        <div className="p-3">
          <h3 className="font-heading text-ink text-sm truncate">{album.name}</h3>
          {album.description && <p className="text-xs text-muted line-clamp-1 mt-0.5">{album.description}</p>}
          {album.hashtags?.length > 0 &&(
            <p className="mt-1 text-xs text-pixblue truncate">{album.hashtags.slice(0, 4).join(" ")}</p>
          )}
        </div>
      </Link>

      {showOwner && album.owner &&(
        <div className="px-3 pb-3 -mt-1 text-xs">
          by <UserName user={album.owner} className="text-xs" />
        </div>
      )}
    </article>
  );
}
