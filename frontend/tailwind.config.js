/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C2420',
        paper: '#FAF8F5',
        surface: '#FFFFFF',
        hairline: '#E5E2DC',
        teal: {
          50: '#EEF7F4',
          100: '#D8EBE4',
          600: '#0E7C66',
          700: '#0F766E',
          800: '#115E59',
        },
        sage: {
          DEFAULT: '#E8F0EA',
          dark: '#C9DCCB',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: ['Georgia', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 36, 32, 0.04)',
      },
    },
  },
  plugins: [],
}
