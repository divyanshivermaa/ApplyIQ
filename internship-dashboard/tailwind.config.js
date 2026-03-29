/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        wine: {
          50: "#f9f1f4",
          100: "#f3e3e8",
          200: "#e7c7d1",
          300: "#d4a0b2",
          400: "#b86d8c",
          500: "#8b1e3f",
          600: "#741734",
          700: "#5d1129",
          800: "#3d0b1b",
          900: "#1f050d",
        },
      },
    },
  },
  plugins: [],
};
