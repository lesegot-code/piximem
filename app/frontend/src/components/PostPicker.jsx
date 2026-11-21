// Student Number: u25143230

//tap photos to select them (used when making an album or adding to one)
export default function PostPicker({ posts, selected, onChange, label = "Choose photos" })
{
  function toggle(id)
  {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  if(!posts.length)
  {
    return <p className="text-sm text-muted">You don't have any photos to add yet. Share a memory first.</p>;
  }

  return(
    <fieldset>
      <legend className="label">
        {label} <span className="text-pixblue">({selected.length} selected)</span>
      </legend>
      <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 pt-1">
        {posts.map((p) =>
        {
          const checked = selected.includes(p._id);
          return(
            <li key={p._id}>
              <label
                className={`relative block aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                  checked ? "border-pixblue" : "border-transparent hover:border-border"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={checked}
                  onChange={() => toggle(p._id)}
                  aria-label={p.caption.slice(0, 60)}
                />
                <img src={p.imageUrl} alt="" className={`w-full h-full object-cover transition ${checked ? "opacity-80" : ""}`} loading="lazy" />
                <span
                  className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-pixblue ${
                    checked ? "bg-pixblue border-pixblue text-white" : "bg-black/40 border-white/80 text-transparent"
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
