// Student Number: u25143230
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Navigation()
{
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() 
  {
    logoutUser();
    navigate("/");
  }

  //helper for consistent NavLink styling
  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "text-pixblue bg-pixblue/10"
        : "text-muted hover:text-pixblue"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <div className="max-w-6xl mx-auto flex items-center gap-2 px-4 py-3">
        <Link to="/home" className="flex items-center gap-2 mr-2">
          <img
            src="/favicon.svg"
            alt="Pixel Memory logo"
            className="w-8 h-8"
          />
          <span className="font-heading text-lg font-semibold text-ink hidden sm:inline">
            Pixel Memory
          </span>
        </Link>

        {/* main links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/home" className={linkClass}>Home</NavLink>
          <NavLink to={`/profile/${user?._id}`} className={linkClass}>
            My Profile
          </NavLink>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light and dark mode"
            className="p-2 rounded-lg text-muted hover:text-pixblue hover:bg-pixblue/10 transition"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* takes user to post creation */}
          <button
            onClick={() => navigate("/home?compose=1")}
            className="btn-primary text-sm"
          >
            <span className="text-lg leading-none">+</span> Share a Memory
          </button>

          <button onClick={handleLogout} className="btn-secondary text-sm">
            Log out
          </button>
        </div>
      </div>

      {/* Mobile nav - second row */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2">
        <NavLink to="/home" className={linkClass}>Home</NavLink>
        <NavLink to={`/profile/${user?._id}`} className={linkClass}>
          My Profile
        </NavLink>
      </div>
    </nav>
  );
}