/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1d2b4e', 50: '#eef1f8', 100: '#d4dbed', 200: '#a9b7db', 300: '#7e93c9', 400: '#5370b7', 500: '#2850a5', 600: '#1d2b4e', 700: '#182440', 800: '#131d33', 900: '#0e1626' },
        accent:  { DEFAULT: '#fcc00c', 50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d', 400: '#fbbf24', 500: '#fcc00c', 600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Kufi Arabic"', '"Cairo"', 'Arial', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' },
    },
  },
  plugins: [],
}
