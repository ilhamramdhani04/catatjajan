/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#D4B483",
        "gold-bright": "#F0CE94",
        cream: "#EDE4D0",
        noir: "#08070F",
      },
      boxShadow: {
        gold: "0 8px 32px rgba(212,180,131,0.28)",
        "gold-sm": "0 2px 12px rgba(212,180,131,0.15)",
      },
    },
  },
  plugins: [],
};
