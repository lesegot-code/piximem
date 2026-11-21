// Student Number: u25143230
import { parseHashtags } from "../utils/hashtags.js";

//hashtag text box with a live preview, plus optional suggestions to click
export default function TagInput({ id, value, onChange, suggestions = [], suggestionLabel = "Suggested" })
{
  const current = parseHashtags(value);
  const remaining = suggestions.filter((s) => !current.includes(s.tag));

  function add(tag)
  {
    onChange([...current, tag].join(" "));
  }

  function remove(tag)
  {
    onChange(current.filter((t) => t !== tag).join(" "));
  }

  return(
    <div>
      <label htmlFor={id} className="label">Hashtags (separate with spaces or commas)</label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="nature sunset travel"
      />

      {current.length > 0 &&(
        <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Hashtags that will be saved">
          {current.map((tag) =>(
            <button
              key={tag}
              type="button"
              onClick={() => remove(tag)}
              className="hashtag-pill text-xs"
              aria-label={`Remove ${tag}`}
            >
              {tag} <span aria-hidden="true" className="ml-1 text-muted">✕</span>
            </button>
          ))}
        </div>
      )}

      {remaining.length > 0 &&(
        <div className="mt-3">
          <p className="text-xs text-muted mb-1.5">{suggestionLabel}</p>
          <div className="flex flex-wrap gap-1.5">
            {remaining.slice(0, 10).map((s) =>(
              <button key={s.tag} type="button" onClick={() => add(s.tag)} className="chip text-xs py-1">
                + {s.tag}
                {s.count > 1 && <span className="text-[10px] bg-pixblue/15 text-pixblue rounded-full px-1.5">×{s.count}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
