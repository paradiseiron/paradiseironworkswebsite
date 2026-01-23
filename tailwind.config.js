/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',   // small phones / large mobile
      md: '768px',   // tablets
      lg: '1024px',  // desktop
      xl: '1280px',
    },
    extend: {},
  },
  plugins: [],
}