import { defineConfig, presetWind4, transformerDirectives } from "unocss";

export default defineConfig({
  presets: [presetWind4({ dark: "class" })],
  transformers: [transformerDirectives()],
  theme: {
    radius: {
      control: "0.5rem",
      card: "1.25rem",
    },
    font: {
      sans: "var(--ds-font-sans)",
      serif: "var(--ds-font-serif)",
      mono: "var(--ds-font-mono)",
    },
  },
  content: {
    pipeline: {
      include: ["./src/**/*.{ts,tsx,html}", "../../packages/ui/src/**/*.{ts,tsx}"],
    },
  },
});
