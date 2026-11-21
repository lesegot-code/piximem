// Student Number: u25143230
import { Link } from "react-router-dom";
import { hashtagLink } from "../utils/hashtags.js";

export default function HashtagList({ tags = [], pills = false, className = "" })
{
  if(!tags.length) return null;

  return(
    <div className={`flex flex-wrap gap-x-2 gap-y-1 text-sm ${className}`}>
      {tags.map((tag) =>(
        <Link key={tag} to={hashtagLink(tag)} className={pills ? "hashtag-pill" : "hashtag-text"}>
          {tag.startsWith("#") ? tag : `#${tag}`}
        </Link>
      ))}
    </div>
  );
}
