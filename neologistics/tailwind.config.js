/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neo: {
          DEFAULT: "#303392",
          50: "#eef0fb",
          100: "#d9dcf5",
          200: "#b3b9eb",
          300: "#8d96e0",
          400: "#5c68cf",
          500: "#303392",
          600: "#282b7a",
          700: "#202362",
          800: "#181b4a",
          900: "#101332",
          950: "#080a1f",
        },
        "neo-red": {
          DEFAULT: "#c8102e",
          50: "#fef2f3",
          100: "#fde2e6",
          400: "#e8324f",
          500: "#c8102e",
          600: "#a50d25",
          700: "#820a1d",
        },
        "neo-blue": {
          DEFAULT: "#2e4db7",
          light: "#4a6fd6",
          accent: "#1a9fd4",
          glow: "#00e5ff",
        },
        ink: "#0f172a",
        slate: {
          850: "#172033",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        serif: ['"Times New Roman"', "Georgia", "serif"],
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "pulse-glow": "pulse-glow 5s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "fade-up": "fade-up 0.8s ease-out forwards",
        shimmer: "shimmer 3s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "scale-in": "scale-in 0.6s ease-out forwards",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.75" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "grid-light":
          "linear-gradient(rgba(48,51,146,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(48,51,146,0.05) 1px, transparent 1px)",
        shimmer:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        "neo-gradient":
          "linear-gradient(135deg, #303392 0%, #2e4db7 40%, #1a9fd4 70%, #303392 100%)",
        "neo-gradient-vivid":
          "linear-gradient(135deg, #c8102e 0%, #303392 35%, #1a9fd4 65%, #00e5ff 100%)",
        "neo-gradient-red":
          "linear-gradient(135deg, #e8324f 0%, #c8102e 50%, #a50d25 100%)",
        "hero-overlay":
          "linear-gradient(105deg, rgba(8,10,31,0.92) 0%, rgba(48,51,146,0.78) 42%, rgba(48,51,146,0.35) 68%, rgba(8,10,31,0.55) 100%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
      boxShadow: {
        neo: "0 24px 60px rgba(48,51,146,0.22)",
        "neo-red": "0 16px 40px rgba(200,16,46,0.25)",
        "border-glow": "0 0 0 1px rgba(255,255,255,0.12), 0 0 40px rgba(26,159,212,0.18)",
        "nav-glow": "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        card: "0 20px 50px rgba(15,23,42,0.08)",
      },
    },
  },
  plugins: [],
};
