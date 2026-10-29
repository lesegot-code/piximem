// Student Number: u25143230
import { useRef, useState } from "react";
import { createPost } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function AddPostForm({ onCreated, onCancel })
{
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // convert chosen file into a previewable url
  function pickFile(f)
  {
    if(!f) return;
    if(!f.type.startsWith("image/"))
    {
      setError("Only image files are allowed.");
      return;
    }
    if(f.size > 5 * 1024 * 1024)
    {
      setError("Image is too large (max 5 MB).");
      return;
    }

    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDragOver(e)
  {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e)
  {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e)
  {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    pickFile(dropped);
  }

  // split "dog, cat #nature" into ["#dog", "#cat", "#nature"]
  function parseHashtags(input)
  {
    return input
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
  }

  async function handleSubmit(e)
  {
    e.preventDefault();

    if(!file)
    {
      setError("Please choose an image.");
      return;
    }
    if(caption.trim().length < 3)
    {
      setError("Caption must be at least 3 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try
    {
      const hashtags = parseHashtags(hashtagInput);

      // multipart form, so we can send the file + fields together
      const newPost = await createPost({
        userId: user._id,
        caption: caption.trim(),
        hashtags,
        image: file,
      });

      // clear for next time
      setCaption("");
      setHashtagInput("");
      setFile(null);
      setPreview(null);

      if(onCreated) onCreated(newPost);
    }
    catch(err)
    {
      setError(err.message);
    }
    finally
    {
      setBusy(false);
    }
  }

  return(
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-heading text-lg text-ink">Share a Memory</h2>

      {/* drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          dragging ? "border-pixblue bg-pixblue/10" : "border-border hover:border-pixblue/60"
        }`}
      >
        {preview ?(
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg object-contain"
          />
        ) :(
          <div className="text-muted text-sm">
            <p className="font-medium text-ink mb-1">Drag & drop your photo here</p>
            <p>or click to choose a file</p>
            <p className="text-xs mt-2">JPG, PNG, WEBP — up to 5 MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {/* caption */}
      <div>
        <label htmlFor="caption" className="block text-sm text-muted mb-1">
          Caption
        </label>
        <textarea
          id="caption"
          className="input resize-none"
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell us about this memory…"
          maxLength={500}
          required
        />
        <p className="text-xs text-muted mt-1">{caption.length}/500</p>
      </div>

      {/* hashtags */}
      <div>
        <label htmlFor="hashtags" className="block text-sm text-muted mb-1">
          Hashtags (separate with spaces or commas)
        </label>
        <input
          id="hashtags"
          className="input"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          placeholder="nature sunset travel"
        />
      </div>

      {error &&(
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel &&(
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Sharing…" : "Share"}
        </button>
      </div>
    </form>
  );
}