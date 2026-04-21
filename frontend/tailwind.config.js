/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        cream: {
          DEFAULT: "#F4F1EA",
          dark: "#EAE5D9",
        },
        forest: {
          DEFAULT: "#1A362D",
          soft: "#294B3F",
        },
        sage: "#A5B49F",
        terracotta: "#C25934",
        ochre: "#D4A373",
        charcoal: "#2C2C2C",
        score: {
          a: "#2E7D32",
          b: "#7CB342",
          c: "#FDD835",
          d: "#FB8C00",
          e: "#D32F2F",
        },
        background: "#F4F1EA",
        foreground: "#1A362D",
        border: "rgba(26,54,45,0.12)",
        muted: {
          DEFAULT: "#EAE5D9",
          foreground: "#5A6B62",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "slow-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "marquee": "marquee 40s linear infinite",
        "slow-spin": "slow-spin 28s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
