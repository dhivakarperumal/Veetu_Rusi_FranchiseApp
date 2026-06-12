/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2D5016",
        primaryLight: "#4A7C23",
        secondary: "#F5F5F5",
        textPrimary: "#000000",
        textSecondary: "#666666",
        textLight: "#FFFFFF",
        backgroundLight: "#FFFFFF",
        backgroundGray: "#F5F5F5",
        border: "#E0E0E0",
        google: "#FFFFFF",
        error: "#FF6B6B",
        success: "#4CAF50",
      },
    },
  },
  plugins: [],
};