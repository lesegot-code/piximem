// Student Number: u25143230
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useUi } from "../context/UiContext.jsx";
import { login, signup } from "../api.js";

const STRIP = ["elephant1", "travel3", "birds1", "nature2", "car2", "travel1", "nature7", "lion1", "nature3"];

const STEPS = [
  { title: "Share a memory", text: "Drop in a photo, write a caption and add hashtags so people can find it." },
  { title: "Collect it in albums", text: "Group your photos, or save a friend's, into albums with their own story." },
  { title: "Follow your people", text: "Add friends, favourite the ones you never want to miss, and see their latest first." },
];

const FEATURES = [
  ["Friends and everyone", "Switch between your friends' activity and the whole community."],
  ["Search that forgives typos", "\"elefant\" still finds the elephants. Suggestions appear as you type."],
  ["Kind by design", "Report posts that break the rules. Moderators review them quickly."],
  ["Day or night", "A light and a dark theme that remember your choice."],
];

const EMPTY = { name: "", username: "", email: "", password: "", confirm: "" };

//scroll position drives the parallax photos, the film strip and the fade-ins
function useScrollEffects(stripRef)
{
  useEffect(() =>
  {
    const root = document.documentElement;
    let frame = 0;

    function update()
    {
      frame = 0;
      root.style.setProperty("--scroll-y", String(window.scrollY));

      const strip = stripRef.current;
      if(strip)
      {
        const box = strip.getBoundingClientRect();
        const progress = (window.innerHeight - box.top) / (window.innerHeight + box.height);
        strip.style.setProperty("--strip-progress", Math.min(1, Math.max(0, progress)).toFixed(3));
      }
    }

    function onScroll()
    {
      if(!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    //sections fade in the first time they scroll into view
    const observer = new IntersectionObserver((entries) =>
    {
      for(const entry of entries)
      {
        if(entry.isIntersecting)
        {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return() =>
    {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
      root.style.removeProperty("--scroll-y");
    };
  }, [stripRef]);
}

function Field({ id, label, type = "text", value, onChange, autoComplete, placeholder, hint })
{
  return(
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && <p id={`${id}-hint`} className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

export default function SplashPage()
{
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useUi();
  const stripRef = useRef(null);

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useScrollEffects(stripRef);

  function change(e)
  {
    setForm({ ...form, [e.target.name.replace("auth-", "")]: e.target.value });
    setError("");
  }

  function switchMode(next)
  {
    setMode(next);
    setError("");
  }

  //quick checks before asking the server
  function validate()
  {
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address, like you@example.com.";
    if(form.password.length < 6) return "Your password needs at least 6 characters.";
    if(mode === "signup")
    {
      if(!/^[a-zA-Z0-9_.]{2,30}$/.test(form.username.trim())) return "Usernames are 2-30 characters: letters, numbers, dots or underscores.";
      if(form.password !== form.confirm) return "The two passwords don't match.";
    }
    return "";
  }

  async function handleSubmit(e)
  {
    e.preventDefault();
    const problem = validate();
    if(problem) return setError(problem);

    setBusy(true);
    try
    {
      const { user } = mode === "signup"
        ? await signup({ name: form.name.trim(), username: form.username.trim(), email: form.email.trim(), password: form.password })
        : await login({ email: form.email.trim(), password: form.password });

      //signing up logs you straight in
      loginUser(user);
      toast(mode === "signup" ? `Welcome to Pixel Memory, ${user.name || user.username}!` : `Welcome back, ${user.name || user.username}`);
      navigate(location.state?.from || "/home", { replace: true });
    }
    catch(err)
    {
      setError(err.message);
      setBusy(false);
    }
  }

  function goToForm(nextMode)
  {
    switchMode(nextMode);
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById(nextMode === "signup" ? "auth-name" : "auth-email")?.focus({ preventScroll: true }), 500);
  }

  return(
    <div className="min-h-screen overflow-x-hidden">
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/images/logo.png" alt="" className="w-9 h-9" />
          <span className="font-heading font-semibold text-ink">Pixel Memory</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="icon-btn" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <span aria-hidden="true">{theme === "dark" ? "☀️" : "🌙"}</span>
            </button>
            <button type="button" onClick={() => goToForm("login")} className="btn-secondary btn-sm">Log in</button>
          </div>
        </div>
      </header>

      <main>
        {/* hero: text on the left, a loose pile of prints that drift apart while scrolling */}
        <section className="relative min-h-[100svh] flex items-center bg-pix-radial">
          <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold text-ink leading-[1.02]">
                Every picture holds a memory.
              </h1>
              <p className="text-lg md:text-xl text-muted max-w-xl mx-auto lg:mx-0">
                Pixel Memory is a photo sharing community. Post the moments that matter, collect them in albums,
                and keep up with the people you care about.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button type="button" onClick={() => goToForm("signup")} className="btn-primary text-base">Create a free account</button>
                <button type="button" onClick={() => goToForm("login")} className="btn-secondary text-base">I already have one</button>
              </div>
            </div>

            <div className="relative h-[24rem] sm:h-[30rem] max-w-md w-full mx-auto" aria-hidden="true">
              <div className="parallax speed-1 tilt-left print absolute left-0 top-10 w-44 sm:w-56 h-56 sm:h-72">
                <img src="/images/landing/lion1.jpg" alt="" />
              </div>
              <div className="parallax speed-3 tilt-right print absolute right-0 top-0 w-48 sm:w-60 h-40 sm:h-48">
                <img src="/images/landing/travel3.jpg" alt="" />
              </div>
              <div className="parallax speed-2 tilt-slight print absolute right-6 bottom-6 w-40 sm:w-52 h-48 sm:h-60">
                <img src="/images/landing/nature7.jpg" alt="" />
              </div>
              <div className="parallax speed-4 tilt-soft print absolute left-10 sm:left-16 bottom-0 w-48 sm:w-60 h-36 sm:h-44">
                <img src="/images/landing/elephant1.jpg" alt="" />
              </div>
            </div>
          </div>

          <a href="#how" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted text-sm hover:text-ink">
            Scroll to see how it works ↓
          </a>
        </section>

        {/* film strip slides sideways with the scroll */}
        <section className="py-10 overflow-hidden border-y border-border bg-surface" aria-hidden="true" ref={stripRef}>
          <div className="film-strip flex gap-3 w-max">
            {[...STRIP, ...STRIP].map((name, i) =>(
              <img key={i} src={`/images/landing/${name}.jpg`} alt="" className="h-40 md:h-52 w-auto rounded-lg object-cover" loading="lazy" />
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="max-w-6xl mx-auto px-4 py-20 md:py-28">
          <h2 className="reveal font-heading text-3xl md:text-4xl text-ink max-w-xl">From camera roll to shared story in three steps.</h2>
          <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) =>(
              <li key={s.title} className="reveal space-y-3">
                <span className="font-heading text-5xl font-bold text-pixblue">{i + 1}</span>
                <h3 className="font-heading text-xl text-ink">{s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* big photo band with a slower drift */}
        <section className="max-w-6xl mx-auto px-4" aria-hidden="true">
          <div className="relative h-[45vh] md:h-[55vh] overflow-hidden rounded-card">
            <img src="/images/landing/travel1.jpg" alt="" className="absolute inset-x-0 top-0 w-full h-[135%] object-cover parallax speed-1" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <p className="reveal absolute inset-x-0 bottom-8 md:bottom-12 text-center font-heading text-2xl md:text-4xl text-white px-6">
              The good days deserve more than a camera roll.
            </p>
          </div>
        </section>

        {/* features */}
        <section className="max-w-6xl mx-auto px-4 py-20 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
          {FEATURES.map(([title, text]) =>(
            <div key={title} className="reveal border-l-2 border-pixamber pl-5">
              <h3 className="font-heading text-lg text-ink">{title}</h3>
              <p className="text-muted mt-1">{text}</p>
            </div>
          ))}
        </section>

        {/* log in / sign up */}
        <section id="join" className="max-w-6xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center scroll-mt-8">
          <div className="reveal space-y-4 text-center lg:text-left">
            <h2 className="font-heading text-3xl md:text-4xl text-ink">
              {mode === "signup" ? "Start your collection." : "Welcome back."}
            </h2>
            <p className="text-muted max-w-md mx-auto lg:mx-0">
              {mode === "signup"
                ? "It's free and takes a minute. You'll be logged in straight away."
                : "Log in to see what your friends have been up to."}
            </p>
          </div>

          <div className="card w-full max-w-md mx-auto">
            <div className="flex mb-5 border-b border-border" role="tablist">
              {[["login", "Log in"], ["signup", "Sign up"]].map(([id, label]) =>(
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => switchMode(id)}
                  className={`flex-1 tab ${mode === id ? "tab-active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {mode === "signup" &&(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field id="auth-name" label="Display name" value={form.name} onChange={change} autoComplete="name" placeholder="e.g. Lesego" />
                  <Field id="auth-username" label="Username" value={form.username} onChange={change} autoComplete="username" placeholder="e.g. lesego" />
                </div>
              )}

              <Field id="auth-email" label="Email" type="email" value={form.email} onChange={change} autoComplete="email" placeholder="you@example.com" />

              <div>
                <label htmlFor="auth-password" className="label">Password</label>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="auth-password"
                    type={showPassword ? "text" : "password"}
                    className="input pr-16"
                    value={form.password}
                    onChange={change}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs link"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {mode === "signup" &&(
                <Field id="auth-confirm" label="Confirm password" type={showPassword ? "text" : "password"} value={form.confirm} onChange={change} autoComplete="new-password" placeholder="Type it again" />
              )}

              {error && <p className="error-box" role="alert">{error}</p>}

              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
              </button>

              <p className="text-sm text-muted text-center pt-1">
                {mode === "login" ? "New here? " : "Already have an account? "}
                <button type="button" onClick={() => switchMode(mode === "login" ? "signup" : "login")} className="link">
                  {mode === "login" ? "Create an account" : "Log in"}
                </button>
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        Pixel Memory · a student project built for IMY 220 at the University of Pretoria
      </footer>
    </div>
  );
}
