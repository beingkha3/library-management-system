/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        academy: {
          50: '#f8fafc',
          100: '#eef2ff',
          200: '#dbe4ff',
          300: '#c4d4ff',
          400: '#5b8def',
          500: '#2563eb',
          600: '#1f56cc',
          700: '#1d4ed8',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      boxShadow: {
        card: '0 10px 30px -18px rgba(15, 23, 42, 0.18)',
        insetLine: 'inset 0 1px 0 rgba(255,255,255,0.5)'
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
