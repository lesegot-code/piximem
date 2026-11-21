// Student Number: u25143230
import { useMemo } from "react";

//avatar sizes used around the site
const SIZES = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-24 h-24",
  "2xl": "w-28 h-28 md:w-32 md:h-32",
};

//turns any text into a repeatable stream of random numbers
function randomFrom(seed)
{
  let h = 1779033703 ^ seed.length;
  for(let i = 0; i < seed.length; i++)
  {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return() =>
  {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

//a mirrored 5x5 "pixel" pattern with its own colours, different for every seed
function pixelPattern(seed)
{
  const random = randomFrom(seed);
  const hue = Math.floor(random() * 360);
  const shift = 30 + Math.floor(random() * 120);

  const cells = [];
  for(let y = 0; y < 5; y++)
  {
    for(let x = 0; x < 3; x++)
    {
      const roll = random();
      if(roll < 0.5) continue;

      //some pixels use a second colour
      const accent = roll > 0.85;
      cells.push({ x, y, accent });
      if(x < 2) cells.push({ x: 4 - x, y, accent });
    }
  }

  return {
    background: `hsl(${hue} 45% 16%)`,
    main: `hsl(${hue} 75% 60%)`,
    accent: `hsl(${(hue + shift) % 360} 85% 62%)`,
    cells,
  };
}

export default function Avatar({ user, size = "md", className = "" })
{
  const sizeClass = SIZES[size] || SIZES.md;
  const name = user?.name || user?.username || "User";
  const seed = user?.avatarSeed || user?.username || "pixel";
  const pattern = useMemo(() => pixelPattern(seed), [seed]);

  //an uploaded photo wins over the generated one
  if(user?.avatar)
  {
    return(
      <img
        src={user.avatar}
        alt={`${name}'s profile picture`}
        className={`${sizeClass} shrink-0 rounded-full object-cover border border-border ${className}`}
      />
    );
  }

  return(
    <svg
      viewBox="-1 -1 7 7"
      className={`${sizeClass} shrink-0 rounded-full border border-border ${className}`}
      role="img"
      aria-label={`${name}'s generated avatar`}
      shapeRendering="crispEdges"
    >
      <rect x="-1" y="-1" width="7" height="7" fill={pattern.background} />
      {pattern.cells.map((c, i) =>(
        <rect key={i} x={c.x} y={c.y} width="1.02" height="1.02" fill={c.accent ? pattern.accent : pattern.main} />
      ))}
    </svg>
  );
}
