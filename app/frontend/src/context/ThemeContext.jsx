import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function startingTheme()
{
  try
  {
    const saved = localStorage.getItem("piximem_theme");
    if(saved) return saved;
  }
  catch
  {
    //storage can be blocked, fall through to the system setting
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children })
{
  const [theme, setTheme] = useState(startingTheme);

  useEffect(() =>
  {
    document.documentElement.setAttribute("data-theme", theme);
    try
    {
      localStorage.setItem("piximem_theme", theme);
    }
    catch
    {
      //the theme still works for this visit
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return(
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme()
{
  return useContext(ThemeContext);
}
