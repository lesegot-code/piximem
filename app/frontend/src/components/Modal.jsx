// Student Number: u25143230
import { useEffect, useId, useRef } from "react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

//one dialog wrapper for every popup: closes on Escape or a click outside
export default function Modal({ title, onClose, size = "md", children })
{
  const titleId = useId();
  const panel = useRef(null);

  useEffect(() =>
  {
    function onKey(e)
    {
      if(e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    //stop the page behind from scrolling
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    //move focus into the dialog unless something inside asked for it
    if(!panel.current?.contains(document.activeElement)) panel.current?.focus();

    return() =>
    {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [onClose]);

  return(
    <div
      className="fixed inset-0 z-50 bg-[var(--overlay)] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => { if(e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`card w-full ${SIZES[size]} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-card outline-none`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id={titleId} className="font-heading text-lg text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="icon-btn -mr-2 -mt-1" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
