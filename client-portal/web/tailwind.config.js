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
          500: "#303392",
          700: "#202362",
          900: "#101332",
          950: "#080a1f",
        },
        "neo-red": { DEFAULT: "#c8102e", 50: "#fef2f3" },
        "neo-blue": { DEFAULT: "#2e4db7", accent: "#1a9fd4" },
        ink: "#0f172a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 20px 50px rgba(15,23,42,0.08)",
      },
      backgroundImage: {
        "neo-gradient":
          "linear-gradient(135deg, #303392 0%, #2e4db7 40%, #1a9fd4 70%, #303392 100%)",
      },
    },
  },
  plugins: [],
};
