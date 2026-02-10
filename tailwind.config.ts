import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Avalaunch-inspired color palette
        primary: {
          purple: "#7B3FF2",
          blue: "#3D5AFE",
          pink: "#F23D8F",
        },
        background: {
          primary: "#0A0E27",
          secondary: "#141B3A",
          tertiary: "#1E2749",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B4B8D6",
          muted: "#6E7397",
        },
        semantic: {
          success: "#00D9A3",
          warning: "#FFC107",
          error: "#FF5252",
          info: "#3D5AFE",
        },
        border: "rgba(123, 63, 242, 0.2)",
        divider: "rgba(255, 255, 255, 0.1)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7B3FF2 0%, #3D5AFE 100%)",
        "gradient-accent": "linear-gradient(135deg, #F23D8F 0%, #7B3FF2 100%)",
        "gradient-card": "linear-gradient(135deg, rgba(123, 63, 242, 0.1) 0%, rgba(61, 90, 254, 0.05) 100%)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
