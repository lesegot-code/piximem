// Student Number: u25143230
import { useState } from "react";
import { createPost, updatePost } from "../api.js";
import { parseHashtags, rankHashtags } from "../utils/hashtags.js";
import ImageDropzone, { useFilePreview } from "./ImageDropzone.jsx";
import TagInput from "./TagInput.jsx";

const MAX_CAPTION = 500;

//one form for creating a post (with image) and editing one (caption + hashtags only)
export default function PostForm({ post = null, recentPosts = [], onDone, onCancel })
{
  const editing = Boolean(post);
  const [caption, setCaption] = useState(post?.caption || "");
  const [tags, setTags] = useState((post?.hashtags || []).join(" "));
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const preview = useFilePreview(file);

  //your most used hashtags, one click to reuse them
  const suggestions = rankHashtags(recentPosts).slice(0, 8);

  async function handleSubmit(e)
  {
    e.preventDefault();

    if(!editing && !file) return setError("Add a photo first: drag one in or click the box.");
    if(caption.trim().length < 3) return setError("Write a caption of at least 3 characters.");

    setBusy(true);
    setError("");

    try
    {
      const hashtags = parseHashtags(tags);
      const saved = editing
        ? await updatePost(post._id, { caption: caption.trim(), hashtags })
        : await createPost({ caption: caption.trim(), hashtags, image: file });
      onDone(saved);
    }
    catch(err)
    {
      setError(err.message);
      setBusy(false);
    }
  }

  return(
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {editing
        ? <p className="text-xs text-muted">You can change the caption and hashtags. The photo stays the same.</p>
        : <ImageDropzone label="Photo" onFile={setFile} onError={setError} preview={preview} />}

      <div>
        <label htmlFor="post-caption" className="label">Caption</label>
        <textarea
          id="post-caption"
          className="input resize-none"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell us about this memory…"
          maxLength={MAX_CAPTION}
        />
        <p className="text-xs text-muted mt-1 text-right">{caption.length}/{MAX_CAPTION}</p>
      </div>

      <TagInput
        id="post-tags"
        value={tags}
        onChange={setTags}
        suggestions={suggestions}
        suggestionLabel="Hashtags you use often"
      />

      {error && <p className="error-box" role="alert">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : editing ? "Save changes" : "Share"}
        </button>
      </div>
    </form>
  );
}
