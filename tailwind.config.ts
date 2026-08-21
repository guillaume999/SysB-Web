import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0e1420",
        panel: "#161d2b",
        edge: "#26314a",
        accent: "#4c8dff",
      },
    },
  },
  plugins: [],
} satisfies Config;
