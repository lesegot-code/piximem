// Student Number: u25143230
import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSuggestions } from "../api.js";
import Avatar from "./Avatar.jsx";

const ICONS = { hashtag: "#", album: "▦", post: "▢" };

//search box with suggestions as you type (arrow keys + enter work too)
export default function SearchInput({ initialValue = "", autoFocus = false, className = "" })
{
  const navigate = useNavigate();
  const listId = useId();
  const boxRef = useRef(null);
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  //wait until typing pauses before asking the server
  useEffect(() =>
  {
    const q = value.trim();
    if(q.replace("#", "").length < 2) return undefined;

    let cancelled = false;
    const timer = setTimeout(async() =>
    {
      try
      {
        const list = await searchSuggestions(q);
        if(!cancelled)
        {
          setSuggestions(list);
          setActive(-1);
        }
      }
      catch
      {
        if(!cancelled) setSuggestions([]);
      }
    }, 200);

    return() =>
    {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  //close the list when clicking somewhere else
  useEffect(() =>
  {
    function onClick(e)
    {
      if(!boxRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return() => document.removeEventListener("mousedown", onClick);
  }, []);

  const showList = open && value.trim().replace("#", "").length >= 2 && suggestions.length > 0;

  function go(link)
  {
    setOpen(false);
    navigate(link);
  }

  function handleSubmit(e)
  {
    e.preventDefault();
    if(showList && active >= 0) return go(suggestions[active].link);

    const q = value.trim();
    if(q) go(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e)
  {
    if(!showList) return;

    if(e.key === "ArrowDown")
    {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    }
    else if(e.key === "ArrowUp")
    {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
    else if(e.key === "Escape")
    {
      setOpen(false);
    }
  }

  return(
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search" ref={boxRef}>
      <label htmlFor={`${listId}-input`} className="sr-only">Search people, posts, albums and hashtags</label>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true">⌕</span>
      <input
        id={`${listId}-input`}
        type="search"
        className="input pl-9"
        placeholder="Search people, posts, #tags"
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showList &&(
        <ul id={listId} role="listbox" className="absolute z-40 mt-2 w-full card p-1 shadow-xl max-h-80 overflow-y-auto">
          {suggestions.map((s, i) =>(
            <li
              key={`${s.type}-${s.link}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(s.link); }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-sm ${
                i === active ? "bg-pixblue/10 text-ink" : "text-ink"
              }`}
            >
              {s.type === "user"
                ? <Avatar user={s.user} size="sm" />
                : <span className="w-8 h-8 rounded-full bg-surface2 text-pixblue flex items-center justify-center shrink-0" aria-hidden="true">{ICONS[s.type]}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{s.label}</span>
                <span className="block text-xs text-muted truncate">{s.type === "user" ? `@${s.label} ${s.sub ? `· ${s.sub}` : ""}` : s.sub}</span>
              </span>
            </li>
          ))}
          <li className="px-3 py-2 text-xs text-muted border-t border-border mt-1">
            Press Enter to see all results
          </li>
        </ul>
      )}
    </form>
  );
}
