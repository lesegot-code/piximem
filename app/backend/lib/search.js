// Student Number: u25143230
//fuzzy matching: finds things when a word is incomplete, misspelled or has swapped letters

//edit distance that also counts two swapped letters as one change ("teh" -> "the")
export function editDistance(a, b)
{
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for(let i = 0; i < rows; i++) d[i][0] = i;
  for(let j = 0; j < cols; j++) d[0][j] = j;

  for(let i = 1; i < rows; i++)
  {
    for(let j = 1; j < cols; j++)
    {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       //delete
        d[i][j - 1] + 1,       //insert
        d[i - 1][j - 1] + cost //replace
      );

      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
      {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); //swap
      }
    }
  }

  return d[a.length][b.length];
}

export function normalise(text)
{
  return String(text || "").toLowerCase().replace(/[^a-z0-9@._\s]/g, " ").trim();
}

function words(text)
{
  return normalise(text).split(/\s+/).filter(Boolean);
}

//how many mistakes we allow for a word of this length
function allowedMistakes(length)
{
  if(length <= 3) return 0;
  if(length <= 5) return 1;
  return 2;
}

//spell words the way they sound, so "elefant" and "elephant" look the same
function soundAlike(word)
{
  return word
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/q/g, "k")
    .replace(/z/g, "s")
    .replace(/^kn/, "n")
    .replace(/^wr/, "r")
    .replace(/(.)\1+/g, "$1"); //"photoo" -> "foto"
}

//score one search word against one word from the data (0 = no match)
function scoreWord(token, word)
{
  if(word === token) return 1;
  if(word.startsWith(token)) return 0.9;
  if(token.length >= 3 && word.includes(token)) return 0.75;

  const a = soundAlike(token);
  const b = soundAlike(word);
  if(a.length >= 3 && b.startsWith(a)) return 0.7;

  const allowed = allowedMistakes(token.length);
  if(!allowed) return 0;

  //compare to the whole word and to its start (so an unfinished word still matches)
  const distance = Math.min(
    editDistance(token, word),
    editDistance(token, word.slice(0, token.length)),
    editDistance(token, word.slice(0, token.length + 1)),
    editDistance(a, b.slice(0, a.length))
  );

  return distance <= allowed ? 0.65 - distance * 0.1 : 0;
}

//score a whole search query against a piece of text (every word must match something)
export function scoreText(query, text)
{
  const q = normalise(query);
  const t = normalise(text);
  if(!q || !t) return 0;

  if(t === q) return 1.2;
  if(t.includes(q)) return 1.1;

  const tokens = words(q);
  const targets = words(t);
  let total = 0;

  for(const token of tokens)
  {
    let best = 0;
    for(const word of targets)
    {
      best = Math.max(best, scoreWord(token, word));
      if(best === 1) break;
    }
    if(best === 0) return 0;
    total += best;
  }

  return total / tokens.length;
}

//best score across several fields, each with a weight
export function scoreFields(query, fields)
{
  let best = 0;
  for(const [text, weight] of fields)
  {
    best = Math.max(best, scoreText(query, text) * weight);
  }
  return best;
}

//sorts by score and drops the non matches
export function rank(items, scorer, limit = 20)
{
  return items
    .map((item) => ({ item, score: scorer(item) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}
