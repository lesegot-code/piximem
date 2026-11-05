// Student Number: u25143230

//full class names so Tailwind keeps them in the build
const PALETTE = [
  "bg-[#3B82F6]", // blue
  "bg-[#F59E0B]", // amber
  "bg-[#10B981]", // green
  "bg-[#8B5CF6]", // purple
  "bg-[#EF4444]", // red
  "bg-[#14B8A6]", // teal
];

//avatar sizes used around the site (px -> tailwind classes)
const SIZES = {
  96: "w-24 h-24 text-4xl",
  40: "w-10 h-10 text-base",
  32: "w-8 h-8 text-sm",
  28: "w-7 h-7 text-xs",
};

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
  const sizeClass = SIZES[size] || SIZES[40];

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
        className={`${sizeClass} shrink-0 rounded-full object-cover border border-border`}
      />
    );
  }

  //otherwise make one from initials + colour
  return(
    <div
      className={`${sizeClass} ${colourFor(name || "user")} shrink-0 rounded-full flex items-center justify-center font-semibold text-white border border-border select-none`}
      aria-label={`${name || "User"} avatar`}
    >
      {initialsFor(name)}
    </div>
  );
}
