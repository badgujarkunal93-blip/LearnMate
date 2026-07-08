/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#1b1b1b",
        bgSecondary: "#141414",
        bgInput: "#242424",
        textPrimary: "#ececec",
        textSecondary: "#a0a0a0",
        accent: {
          light: "#ea9d58",
          DEFAULT: "#e07a5f", // Burnt orange theme for warm dark look
          dark: "#c15437",
        },
        chatUser: "#2b2b2b",
        chatAgent: "#1b1b1b",
      },
    },
  },
  plugins: [],
}
