// Tailwind v4 runs entirely through its PostCSS plugin - no tailwind.config.js
// is needed, and content sources are detected automatically. The design tokens
// live in src/app/globals.css under @theme.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
