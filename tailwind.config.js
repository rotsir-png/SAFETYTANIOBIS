/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace'],
        game: ['Kanit', '"Fredoka One"', 'cursive'],
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        pop: 'pop 0.3s ease-out',
        flash: 'flash 0.3s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'screen-shake': 'screenShake 0.3s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%': { transform: 'translateX(-10px) rotate(-3deg)' },
          '35%': { transform: 'translateX(10px) rotate(3deg)' },
          '55%': { transform: 'translateX(-6px) rotate(-1deg)' },
          '75%': { transform: 'translateX(6px) rotate(1deg)' },
          '90%': { transform: 'translateX(-2px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '60%': { transform: 'scale(1.4)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.1' },
        },
        slideIn: {
          from: { transform: 'translateX(120%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        screenShake: {
          '0%, 100%': { transform: 'translate(0,0)' },
          '20%': { transform: 'translate(-4px, -4px)' },
          '40%': { transform: 'translate(4px, 4px)' },
          '60%': { transform: 'translate(-4px, 4px)' },
          '80%': { transform: 'translate(4px, -4px)' },
        },
      },
    },
  },
  plugins: [],
};
