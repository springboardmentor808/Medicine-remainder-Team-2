/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pillsync: { green: "#2c7a59", mint: "#d8f2e5", ink: "#24302b", line: "#e2e8e1" }
      }
    },
  },
  plugins: [],
}

