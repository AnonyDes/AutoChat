/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#25D366",
          foreground: "#000000",
          50: "#effef4",
          100: "#dbfce5",
          200: "#bbf8ce",
          300: "#8bf0ae",
          400: "#52e38a",
          500: "#25d366",
          600: "#1ab853",
          700: "#169043",
          800: "#167239",
          900: "#155e33",
          950: "#05341a",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
