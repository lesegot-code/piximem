// Student Number: u25143230
import { useState } from "react";
import { createAlbum, updateAlbum } from "../api.js";
import { parseHashtags, rankHashtags } from "../utils/hashtags.js";
import TagInput from "./TagInput.jsx";
import PostPicker from "./PostPicker.jsx";

//create an album (pick photos too) or edit its name, description and hashtags
export default function AlbumForm({ album = null, myPosts = [], albumPosts = [], startWith = [], onDone, onCancel })
{
  const editing = Boolean(album);
  const [name, setName] = useState(album?.name || "");
  const [description, setDescription] = useState(album?.description || "");
  const [tags, setTags] = useState((album?.hashtags || []).join(" "));
  const [selected, setSelected] = useState(startWith);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  //recommend the hashtags used by the photos in the album, most frequent first
  const photos = editing ? albumPosts : myPosts.filter((p) => selected.includes(p._id));
  const suggestions = rankHashtags(photos);

  async function handleSubmit(e)
  {
    e.preventDefault();
    if(name.trim().length < 2) return setError("Give your album a name of at least 2 characters.");

    setBusy(true);
    setError("");

    const fields = { name: name.trim(), description: description.trim(), hashtags: parseHashtags(tags) };
    try
    {
      const saved = editing
        ? await updateAlbum(album._id, fields)
        : await createAlbum({ ...fields, postIds: selected });
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
      <div>
        <label htmlFor="album-name" className="label">Album name</label>
        <input
          id="album-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g. Summer road trip"
        />
      </div>

      <div>
        <label htmlFor="album-description" className="label">Description</label>
        <textarea
          id="album-description"
          className="input resize-none"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          placeholder="What ties these photos together?"
        />
      </div>

      {!editing &&(
        <PostPicker posts={myPosts} selected={selected} onChange={setSelected} label="Photos to start with" />
      )}

      <TagInput
        id="album-tags"
        value={tags}
        onChange={setTags}
        suggestions={suggestions}
        suggestionLabel={photos.length
          ? "Suggested from the photos in this album (most used first)"
          : "Pick some photos to get hashtag suggestions"}
      />

      {error && <p className="error-box" role="alert">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : editing ? "Save changes" : "Create album"}
        </button>
      </div>
    </form>
  );
}
