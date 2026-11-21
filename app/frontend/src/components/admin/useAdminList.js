// Student Number: u25143230
import { useCallback, useEffect, useState } from "react";

//loads a list for an admin panel and lets the panel reload it after a change
export function useAdminList(loader)
{
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;
    loader()
      .then((data) => { if(!cancelled) { setList(data); setError(""); } })
      .catch((err) => { if(!cancelled) setError(err.message); });
    return() => { cancelled = true; };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { list, error, reload };
}
