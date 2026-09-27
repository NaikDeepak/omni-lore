/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          900: '#070913',
          800: '#0d1224',
          700: '#161d38',
          600: '#232c52',
          500: '#384576',
        },
        dao: {
          gold: '#eab308',
          amber: '#f59e0b',
          crimson: '#ef4444',
          cyan: '#06b6d4',
          emerald: '#10b981',
          purple: '#a855f7',
        }
      },
    },
  },
  plugins: [],
};
