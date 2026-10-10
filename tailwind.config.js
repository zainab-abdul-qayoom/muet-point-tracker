/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muet: {
          darkest: '#06100c',
          dark: '#0a1713',
          card: '#0f221a',
          cardHover: '#132b21',
          surface: '#142d23',
          border: '#1b3b2f',
          borderLight: '#234d3d',
          primary: '#10b981',
          primaryDark: '#059669',
          primaryLight: '#34d399',
          mint: '#6ee7b7',
          softMint: '#d1fae5',
          textMuted: '#94a3b8',
          textSubtle: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
