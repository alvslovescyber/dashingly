/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        glass: {
          white: "rgba(255, 255, 255, 0.1)",
          "white-light": "rgba(255, 255, 255, 0.05)",
          "white-medium": "rgba(255, 255, 255, 0.15)",
          "white-strong": "rgba(255, 255, 255, 0.25)",
          border: "rgba(255, 255, 255, 0.2)",
          "border-light": "rgba(255, 255, 255, 0.1)",
        },
        accent: {
          blue: "#3B82F6",
          "blue-light": "#60A5FA",
          teal: "#14B8A6",
          green: "#22C55E",
        },
      },
      borderRadius: {
        glass: "24px",
        tile: "20px",
        chip: "12px",
        button: "10px",
      },
      backdropBlur: {
        glass: "20px",
        subtle: "8px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.1)",
        tile: "0 4px 16px rgba(0, 0, 0, 0.08)",
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
      },
      spacing: {
        sidebar: "72px",
        topbar: "64px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
