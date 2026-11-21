import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children })
{
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); //true once we know if there is a session

  //the session lives in an httpOnly cookie, so ask the server who we are
  const refreshUser = useCallback(async() =>
  {
    try
    {
      const { user: me } = await getMe();
      setUser(me);
      return me;
    }
    catch
    {
      setUser(null);
      return null;
    }
  }, []);

  //check the cookie once when the site opens
  useEffect(() =>
  {
    let cancelled = false;
    getMe()
      .then(({ user: me }) => { if(!cancelled) setUser(me); })
      .catch(() => { if(!cancelled) setUser(null); })
      .finally(() => { if(!cancelled) setReady(true); });
    return() => { cancelled = true; };
  }, []);

  async function logoutUser()
  {
    try
    {
      await apiLogout();
    }
    finally
    {
      setUser(null);
    }
  }

  return(
    <AuthContext.Provider value={{ user, ready, loginUser: setUser, refreshUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth()
{
  return useContext(AuthContext);
}
