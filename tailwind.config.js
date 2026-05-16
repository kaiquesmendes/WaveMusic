/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-up': 'scaleUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        slideUp: {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}