// Student Number: u25143230
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { login, signup } from "../api.js";

const CATEGORIES = [
  { icon: "📸", title: "Posts", desc: "Share photos with captions and hashtags" },
  { icon: "🌿", title: "Nature", desc: "Landscapes and scenery worth remembering" },
  { icon: "🐾", title: "Wildlife", desc: "Pets and animals from every adventure" },
  { icon: "🚗", title: "Cars & Travel", desc: "Road trips, rides, and journeys worth sharing" },
];

const HASHTAGS = ["#travel", "#wildlife", "#nature", "#cars"];

export default function SplashPage() 
{
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ email: "", password: "", confirm: "", username: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(e) 
  {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  //client-side validation
  function validate() 
  {
    if(!form.email.includes("@")) return "Please enter a valid email address.";
    if(form.password.length < 6) return "Password must be at least 6 characters.";
    if(mode === "signup") 
    {
      if(form.username.trim().length < 2) return "Username must be at least 2 characters.";
      if(form.password !== form.confirm) return "Passwords do not match.";
    }
    return "";
  }

  async function handleSubmit(e)
  {
    e.preventDefault();
    const problem = validate();
    if(problem) 
    { 
      setError(problem); 
      return; 
    }

    setBusy(true);
    try {
      if(mode === "signup") 
      {
        const created = await signup({
          email: form.email, 
          password: form.password, 
          username: form.username
        });
        //auto-login after signup
        loginUser({ 
          _id: created._id, 
          email: created.email, 
          username: created.username 
        });
        navigate("/home");
      } 
      else
      {
        const result = await login({ email: form.email, password: form.password });
        loginUser(result.user);
        navigate("/home");
      }
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

  function scrollToForm(nextMode) 
  {
    setMode(nextMode);
    document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" });
  }

  return(
    <div className="min-h-screen">
      {/* hero */}
      <section className="relative overflow-hidden bg-pix-radial">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 text-center animate-fadeUp">
          {/* logo + brand */}
          <img src="/favicon.svg" alt="Pixel Memory logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-ink">
            Pixel Memory
          </h1>
          <p className="mt-2 text-pixblue font-heading font-semibold">
            PixiMem
          </p>

          {/* Tagline */}
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-ink font-heading font-semibold">
            Every Picture Holds a Memory. Share the Ones That Matter Most.
          </p>
          <p className="mt-3 max-w-xl mx-auto text-muted">
            Pixel Memory is a social platform where you capture, organise, and share the moments
            that mean the most — from landscapes and wildlife to cars and road trips.
          </p>

          {/* actions */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => scrollToForm("signup")}
              className="btn-primary text-base"
            >
              Get Started
            </button>
            <button
              onClick={() => scrollToForm("login")}
              className="btn-secondary text-base"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* category cards */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((c) =>(
            <div key={c.title} className="card text-center">
              <div className="text-4xl mb-2">{c.icon}</div>
              <h3 className="font-heading text-lg text-ink mb-1">{c.title}</h3>
              <p className="text-sm text-muted">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* community strips */}
      <section className="max-w-4xl mx-auto px-4 pb-12 text-center">
        <h2 className="font-heading text-2xl text-ink mb-3">
          Join the Pixel Memory community
        </h2>
        <p className="text-muted mb-4">
          Create albums, follow friends, and explore a global feed full of moments worth remembering.
          It only takes a minute — and it's free.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {HASHTAGS.map((h) =>(
            <span key={h} className="hashtag-pill">{h}</span>
          ))}
        </div>
      </section>

      {/* auth form */}
      <section id="auth-form" className="max-w-md mx-auto px-4 pb-20">
        <div className="card">
          {/* tabs */}
          <div className="flex mb-5 border-b border-border">
            {["login", "signup"].map((m) =>(
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium transition ${
                  mode === m
                    ? "text-pixblue border-b-2 border-pixblue"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" &&(
              <div>
                <label htmlFor="username" className="block text-sm text-muted mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  className="input"
                  value={form.username}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Lesego"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-muted mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-muted mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="At least 6 characters"
              />
            </div>

            {mode === "signup" &&(
              <div>
                <label htmlFor="confirm" className="block text-sm text-muted mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  className="input"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  placeholder="Repeat your password"
                />
              </div>
            )}

            {error &&(
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
            </button>

            <p className="text-sm text-muted text-center pt-2">
              {mode === "login" ?(
                <>
                  New here?{" "}
                  <button type="button" onClick={() => setMode("signup")} className="text-pixblue font-medium">
                    Create an account
                  </button>
                </>
              ) :(
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-pixblue font-medium">
                    Log In
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}