/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A1929",
        foreground: "#ECEDEE",
        primary: {
          50: "#0D2E67",
          100: "#0F3B83",
          200: "#104DA3",
          300: "#125FC5",
          400: "#1471E6",
          500: "#2684FF",
          600: "#57A9FF",
          700: "#89C3FF",
          800: "#B9DCFF",
          900: "#E3F2FF",
          DEFAULT: "#2684FF",
          foreground: "#FFFFFF"
        },
        content1: "#0F2942",
        content2: "#14354F",
        default: {
          400: "#6B7280",
          500: "#9CA3AF",
        },
        success: {
          500: "#22C55E",
        },
        danger: {
          500: "#FF5757",
        },
        warning: {
          500: "#F59E0B",
        },
        focus: "#57A9FF"
      }
    },
  },
  plugins: [],
  
}