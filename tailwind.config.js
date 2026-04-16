/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#001c03",
        "primary-fixed": "#94f990",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#002204",
        "secondary": "#4e5e81",
        "surface": "#f7f9fc",
        "surface-container": "#eceef1",
        "surface-container-low": "#f2f4f7",
        "surface-container-high": "#e6e8eb",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#191c1e",
        "on-surface-variant": "#44474e",
        "outline": "#75777f",
        "outline-variant": "#c4c7c5",
      },
      fontFamily: {
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      spacing: {
        "2": "0.5rem",
        "4": "1rem",
        "6": "1.5rem",
        "8": "2rem",
        "12": "3rem",
        "16": "4rem",
        "24": "6rem",
      },
      borderRadius: {
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
      },
      backdropBlur: {
        "12": "12px",
        "20": "20px",
      },
    },
  },
  plugins: [],
}
