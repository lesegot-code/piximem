// Student Number: u25143230

const PALETTE = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#10B981", // green
  "#8B5CF6", // purple
  "#EF4444", // red
  "#14B8A6", // teal
];

function colourFor(name)
{
  let hash = 0;
  for(let i = 0; i < name.length; i++)
  {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return PALETTE[Math.abs(hash) % PALETTE.length];
}

//get two initials from a name
function initialsFor(name)
{
  if(!name) return "?";

  const parts = name.trim().split(/\s+/);
  if(parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, avatarUrl, size = 40 })
{
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.4),
  };

  //if the user uploaded a real avatar, show it
  if(avatarUrl)
  {
    const fullUrl = avatarUrl.startsWith("http")
      ? avatarUrl
      : `http://localhost:3000/uploads/${avatarUrl}`;

    return(
      <img
        src={fullUrl}
        alt={`${name}'s avatar`}
        className="rounded-full object-cover border border-border"
        style={style}
      />
    );
  }

  //otherwise make one from initials + colour
  return(
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white border border-border select-none"
      style={{ ...style, backgroundColor: colourFor(name || "user") }}
      aria-label={`${name || "User"} avatar`}
    >
      {initialsFor(name)}
    </div>
  );
}