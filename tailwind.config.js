/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0d0d14',
        card: '#1a1a2e',
        'card-elevated': '#22223b',
        primary: '#7c3aed',
        'primary-light': '#a78bfa',
        'primary-dark': '#5b21b6',
        secondary: '#2563eb',
        accent: '#f0a500',
        border: '#2d2d44',
        muted: '#6b7280',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
      },
    },
  },
  plugins: [],
};
