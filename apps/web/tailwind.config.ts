import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: ["class"],
  plugins: [require("@tailwindcss/typography")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          500: "#1d4ed8",
          600: "#1e40af",
          700: "#1e3a8a",
          900: "#172554",
        },
        ink: "#111827",
        paper: "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
};

export default config;
