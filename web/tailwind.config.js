/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(var(--ll-brand) / <alpha-value>)",
          fg: "rgb(var(--ll-brand-fg) / <alpha-value>)",
          deep: "rgb(var(--ll-brand-deep) / <alpha-value>)",
          muted: "rgb(var(--ll-brand-muted) / <alpha-value>)",
        },
        ink: "rgb(var(--ll-ink) / <alpha-value>)",
        paper: "rgb(var(--ll-paper) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--ll-brand) / <alpha-value>)",
          fg: "rgb(var(--ll-brand-fg) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--ll-secondary) / <alpha-value>)",
          fg: "rgb(var(--ll-secondary-fg) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--ll-info) / <alpha-value>)",
          muted: "rgb(var(--ll-info-muted) / <alpha-value>)",
          fg: "rgb(var(--ll-info-fg) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--ll-success) / <alpha-value>)",
          muted: "rgb(var(--ll-success-muted) / <alpha-value>)",
          fg: "rgb(var(--ll-success-fg) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--ll-warning) / <alpha-value>)",
          muted: "rgb(var(--ll-warning-muted) / <alpha-value>)",
          fg: "rgb(var(--ll-warning-fg) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--ll-danger) / <alpha-value>)",
          muted: "rgb(var(--ll-danger-muted) / <alpha-value>)",
          fg: "rgb(var(--ll-danger-fg) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};

module.exports = config;
