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
        brand: {
          purple: "#7c3aed",
          pink: "#db2777",
          orange: "#f97316",
          teal: "#14b8a6",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #7c3aed, #db2777, #f97316)",
      },
      boxShadow: {
        glow: "0 0 30px rgba(124, 58, 237, 0.3)",
        "glow-pink": "0 0 30px rgba(219, 39, 119, 0.3)",
      },
    },
  },
  plugins: [],
};
