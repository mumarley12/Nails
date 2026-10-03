import type { Config } from "tailwindcss";

// Design tokens — mudar aqui muda o site e o painel ao mesmo tempo.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#D4B27A", text: "#8A6532", light: "#F1E8DA", soft: "#FAF6F0" },
        night: { DEFAULT: "#131010", raised: "#1C1817", line: "#2E2724", muted: "#A3968C" },
        cream: { DEFAULT: "#EFE8E1", soft: "#DCD2C8" },
        ink: { DEFAULT: "#161616", muted: "#666666", soft: "#5C5C5C" },
        line: "#E8E8E8",
        ok: { bg: "#E8F3EC", fg: "#2F6B45" },
        warn: { bg: "#FBEFD9", fg: "#7A4B00" },
        bad: { bg: "#F9E1E4", fg: "#A3283F" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { btn: "2px", card: "4px" },
      letterSpacing: { label: "0.14em", eyebrow: "0.3em" },
      maxWidth: { page: "1312px" },
    },
  },
  plugins: [],
} satisfies Config;
