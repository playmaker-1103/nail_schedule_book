import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      colors: {
        salon: {
          ink: "#17211f",
          line: "#d8dfdc",
          soft: "#f7f9f8",
          accent: "#0f766e"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
