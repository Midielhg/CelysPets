/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fdf9f0',
          100: '#faf7f0',
          200: '#f5f1e8',
          warm: '#f8f5ee',
          soft: '#fbf8f1',
        }
      }
    },
  },
  plugins: [],
}