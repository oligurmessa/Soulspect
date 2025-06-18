/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",

  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#111111', // Change to your preferred color
        'brand-white': '#ffffff',
        'border': '#e5e7eb', // Default Tailwind border color
      },
    },
  },
  plugins: [],
};
