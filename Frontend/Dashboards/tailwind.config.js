/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F8F7",
        ink: { DEFAULT: "#0F2A33", soft: "#4A6169" },
        line: "#D6E0DD",
        brand: { DEFAULT: "#0E7C7B", dark: "#0A5C5B", tint: "#E1F2F0" },
        pending: { DEFAULT: "#9A6200", tint: "#FFF3D6" },
        verified: { DEFAULT: "#2A7A4B", tint: "#E1F3E8" },
        corrected: { DEFAULT: "#2F5DA8", tint: "#E3ECF9" },
        flag: { DEFAULT: "#B2432F", tint: "#FBE8E4" },
      },
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
