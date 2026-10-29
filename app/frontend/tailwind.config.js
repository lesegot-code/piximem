/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "var(--bg)",
        surface: "var(--surface)",
        border:  "var(--border)",
        muted:   "var(--muted)",
        ink:     "var(--text)",
        pixblue:  "#3B82F6",
        pixamber: "#F59E0B",
        pixnavy:  "#0F172A",
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body:    ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        glow: "0 0 0 1px #3B82F6, 0 0 24px rgba(59,130,246,0.20)",
      },
      backgroundImage: {
        // subtle radial gradient used on the splash hero
        "pix-radial":
          "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(circle at 80% 80%, rgba(245,158,11,0.15), transparent 55%)",
        "pix-banner":
          "linear-gradient(90deg, #0F172A 0%, rgba(59,130,246,0.55) 55%, rgba(245,158,11,0.45) 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};