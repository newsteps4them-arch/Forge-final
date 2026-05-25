export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F5A623",
        "primary-dark": "#D08C1D",
        "text-primary": "#FFFFFF",
        "text-dim": "#A1A1AA",
        card: "#111111",
        "card-hover": "#1A1A1A",
        success: "#4CAF50",
        error: "#F44336",
        warning: "#FFC107"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
