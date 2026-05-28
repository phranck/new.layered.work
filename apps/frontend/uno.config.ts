import { defineConfig, presetWind4, transformerDirectives } from "unocss";

export default defineConfig({
  presets: [presetWind4({ dark: "class" })],
  transformers: [transformerDirectives()],
  theme: {
    font: {
      sans: "var(--lw-font-body)",
      mono: "var(--lw-font-mono)",
    },
  },
  content: {
    pipeline: {
      include: ["./src/**/*.{ts,tsx,html}", "../../packages/**/*.{ts,tsx,css}"],
    },
  },
});
