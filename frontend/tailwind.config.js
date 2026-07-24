/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#FFD1DC',
          green: '#C1E1C1', // Bambu vibe
          yellow: '#FDFD96',
          blue: '#AEC6CF',
          salmon: '#FFB7B2', // Sushi vibe
          cream: '#FFFDD0',
        }
      }
    },
  },
  plugins: [],
}
