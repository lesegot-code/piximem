// Student Number: u25143230
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import Avatar from "./Avatar.jsx";
import NotificationBell from "./NotificationBell.jsx";
import SearchInput from "./SearchInput.jsx";

export default function Navigation()
{
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setComposeOpen, toast } = useUi();
  const navigate = useNavigate();

  async function handleLogout()
  {
    await logoutUser();
    toast("You're logged out. See you soon!");
    navigate("/");
  }

  //consistent link styling, highlighted on the current page
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
      isActive ? "text-pixblue bg-pixblue/10" : "text-muted hover:text-pixblue"
    }`;

  const links =(
    <>
      <NavLink to="/home" className={linkClass}>Home</NavLink>
      <NavLink to="/search" className={linkClass}>Search</NavLink>
      <NavLink to={`/profile/${user._id}`} className={linkClass}>My Profile</NavLink>
      {user.isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
    </>
  );

  return(
    <nav className="sticky top-0 z-40 border-b border-border bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur" aria-label="Main">
      <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 py-3">
        <Link to="/home" className="flex items-center gap-2 mr-1 shrink-0" aria-label="Pixel Memory home">
          <img src="/images/logo.png" alt="" className="w-9 h-9" />
          <span className="font-heading text-lg font-semibold text-ink hidden sm:inline">Pixel Memory</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">{links}</div>

        <SearchInput className="hidden lg:block flex-1 max-w-xs ml-2" />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="icon-btn"
          >
            <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>

          <NotificationBell />

          <button type="button" onClick={() => setComposeOpen(true)} className="btn-primary btn-sm">
            <span className="text-lg leading-none" aria-hidden="true">+</span>
            <span className="hidden sm:inline">Share a Memory</span>
            <span className="sr-only sm:hidden">Share a Memory</span>
          </button>

          <Link to={`/profile/${user._id}`} className="hidden sm:block" aria-label="My profile">
            <Avatar user={user} size="sm" />
          </Link>

          <button type="button" onClick={handleLogout} className="btn-secondary btn-sm">
            Log out
          </button>
        </div>
      </div>

      {/* phones and tablets get the links on a second row */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">{links}</div>
    </nav>
  );
}
