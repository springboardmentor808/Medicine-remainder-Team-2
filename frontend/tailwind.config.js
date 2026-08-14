/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dbe2ff',
          300: '#bfcbff',
          400: '#99aaff',
          500: '#6366f1', // Indigo main
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981', // Emerald/Green
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b', // Amber/Yellow
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444', // Red/Rose
          600: '#dc2626',
        },
        darkbg: {
          900: '#0f172a', // Slate 900
          800: '#1e293b', // Slate 800
          700: '#334155', // Slate 700
          950: '#020617', // Slate 950
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-primary': '0 0 15px rgba(99, 102, 241, 0.4)',
        'glow-success': '0 0 15px rgba(16, 185, 129, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
