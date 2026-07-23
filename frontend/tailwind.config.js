/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dce5ff',
          300: '#c5d3ff',
          400: '#9eb2ff',
          500: '#6366f1', // Indigo primary
          600: '#4f46e5',
          700: '#3730a3',
          800: '#312e81',
          900: '#1e1b4b',
        },
        dark: {
          50: '#f6f6f7',
          100: '#eef0f2',
          200: '#d5d9df',
          300: '#abb4be',
          400: '#7a8795',
          500: '#566270',
          600: '#444d5a',
          700: '#333b45',
          800: '#1e2329',
          900: '#12141c',
        }
      }
    },
  },
  plugins: [],
}
