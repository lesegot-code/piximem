import { createContext, useCallback, useContext, useRef, useState } from "react";
import Modal from "../components/Modal.jsx";

//toasts (short feedback messages), confirm dialogs and the "share a memory" form
const UiContext = createContext(null);

export function UiProvider({ children })
{
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0); //pages reload when this changes
  const resolver = useRef(null);

  const toast = useCallback((message, type = "success") =>
  {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  //await confirm({...}) gives true or false, like window.confirm but styled
  const confirm = useCallback((options) =>
  {
    setDialog(options);
    return new Promise((resolve) => { resolver.current = resolve; });
  }, []);

  function closeDialog(answer)
  {
    setDialog(null);
    resolver.current?.(answer);
  }

  const refreshData = useCallback(() => setDataVersion((v) => v + 1), []);

  return(
    <UiContext.Provider value={{ toast, confirm, composeOpen, setComposeOpen, dataVersion, refreshData }}>
      {children}

      {dialog &&(
        <Modal title={dialog.title} onClose={() => closeDialog(false)} size="sm">
          <p className="text-sm text-muted">{dialog.message}</p>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="btn-secondary btn-sm" onClick={() => closeDialog(false)}>
              Cancel
            </button>
            <button
              type="button"
              autoFocus
              className={`${dialog.danger ? "btn-danger" : "btn-primary"} btn-sm`}
              onClick={() => closeDialog(true)}
            >
              {dialog.confirmLabel || "Confirm"}
            </button>
          </div>
        </Modal>
      )}

      {/* toasts stack in the bottom corner */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 items-stretch sm:items-end" aria-live="polite">
        {toasts.map((t) =>(
          <div
            key={t.id}
            role="status"
            className={`card py-3 px-4 text-sm shadow-lg sm:max-w-sm border-l-4 ${
              t.type === "error" ? "border-l-danger" : "border-l-success"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUi()
{
  return useContext(UiContext);
}
