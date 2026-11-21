// Student Number: u25143230

//"dog, cat #Nature" -> ["#dog", "#cat", "#nature"] (same rules as the server)
export function parseHashtags(input)
{
  const tags = String(input || "")
    .split(/[\s,]+/)
    .map((t) => t.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_]/g, ""))
    .filter(Boolean)
    .map((t) => `#${t}`);

  return [...new Set(tags)].slice(0, 15);
}

//hashtags used by a set of posts, most used first, no duplicates
export function rankHashtags(posts, exclude = [])
{
  const counts = {};
  for(const post of posts)
  {
    for(const tag of new Set(post.hashtags || [])) counts[tag] = (counts[tag] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([tag]) => !exclude.includes(tag))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

//clicking a hashtag does the same as searching for it
export function hashtagLink(tag)
{
  const clean = tag.startsWith("#") ? tag : `#${tag}`;
  return `/search?q=${encodeURIComponent(clean)}`;
}
