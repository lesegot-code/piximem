// Student Number: u25143230
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchInput({ initialValue = "" })
{
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);

  function handleSubmit(e)
  {
    e.preventDefault();
    const q = value.trim();
    if(!q) return;

    navigate(`/home?q=${encodeURIComponent(q)}`);
  }

  return(
    <form onSubmit={handleSubmit} className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        🔍
      </span>
      <input
        type="text"
        className="input pl-9"
        placeholder="Search users, posts, albums, #hashtags…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Search"
      />
    </form>
  );
}