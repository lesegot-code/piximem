// Student Number: u25143230
import { useId, useMemo, useRef, useState } from "react";

const MAX_MB = 5;

//drag and drop (or click) to pick one image; used for posts and profile pictures
export default function ImageDropzone({ onFile, onError, preview, label, round = false, compact = false })
{
  const inputRef = useRef(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);

  function pick(file)
  {
    if(!file) return;
    if(!file.type.startsWith("image/")) return onError?.("That file isn't an image. Choose a JPG, PNG or WEBP.");
    if(file.size > MAX_MB * 1024 * 1024) return onError?.(`That image is too big. The limit is ${MAX_MB} MB.`);

    onError?.("");
    onFile(file);
  }

  function handleDrop(e)
  {
    e.preventDefault(); //otherwise the browser opens the file
    setDragging(false);
    pick(e.dataTransfer.files?.[0]);
  }

  return(
    <div>
      <label htmlFor={inputId} className="label">{label}</label>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${inputId}-hint`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl cursor-pointer transition ${
          dragging ? "border-pixblue bg-pixblue/10" : "border-border hover:border-pixblue/60"
        } ${compact ? "flex items-center gap-4 p-3" : "p-6 text-center"}`}
      >
        {preview &&(
          <img
            src={preview}
            alt="Selected"
            className={round
              ? "w-16 h-16 rounded-full object-cover border border-border shrink-0"
              : "max-h-64 mx-auto rounded-lg object-contain"}
          />
        )}

        {(!preview || compact) &&(
          <div id={`${inputId}-hint`} className="text-sm text-muted">
            <p className="font-medium text-ink">{dragging ? "Drop it here" : "Drag and drop a photo here"}</p>
            <p>or click to choose a file</p>
            {!compact && <p className="text-xs mt-2">JPG, PNG or WEBP, up to {MAX_MB} MB</p>}
          </div>
        )}

        {preview && !compact && <p className="text-xs text-muted mt-2">Click or drop another photo to replace it</p>}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

//makes a local preview url for a chosen file
// eslint-disable-next-line react-refresh/only-export-components
export function useFilePreview(file)
{
  return useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
}
