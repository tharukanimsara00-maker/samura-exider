// Developer: AKARSHANA
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyan: {
          DEFAULT: "#00FFFF",
          dim: "#00C8C8",
          dark: "#007878",
          glow: "rgba(0,255,255,0.15)",
        },
        dark: {
          DEFAULT: "#0A0A0F",
          card: "#0F0F1A",
          border: "#1A1A2E",
          surface: "#12121E",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        rajdhani: ["Rajdhani", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
      },
      boxShadow: {
        neon: "0 0 20px rgba(0,255,255,0.4), 0 0 40px rgba(0,255,255,0.1)",
        "neon-sm": "0 0 10px rgba(0,255,255,0.3)",
        "neon-lg": "0 0 40px rgba(0,255,255,0.5), 0 0 80px rgba(0,255,255,0.2)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse at 50% 0%, rgba(0,255,255,0.15) 0%, transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(0,255,255,0.05) 0%, rgba(0,0,0,0) 100%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "pulse-neon": "pulseNeon 2s ease-in-out infinite",
        "scan-line": "scanLine 3s linear infinite",
        float: "float 3s ease-in-out infinite",
        "border-flow": "borderFlow 4s linear infinite",
      },
      keyframes: {
        pulseNeon: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(0,255,255,0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(0,255,255,0.7), 0 0 60px rgba(0,255,255,0.3)" },
        },
        scanLine: {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
    },
  },
  plugins: [],
};
