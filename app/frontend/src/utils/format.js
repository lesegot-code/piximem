// Student Number: u25143230

//"just now", "5m", "3h", "2d", or a date for older things
export function timeAgo(date)
{
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if(seconds < 60) return "just now";
  if(seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if(seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if(seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function fullDate(date)
{
  return new Date(date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function plural(count, word, many = `${word}s`)
{
  return `${count} ${count === 1 ? word : many}`;
}
