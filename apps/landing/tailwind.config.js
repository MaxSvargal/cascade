/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00E599',
          blue: '#00B8FF',
          dark: '#0a0a0a',
        },
        gray: {
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 153, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 229, 153, 0.6)' }
        },
        fadeInUp: {
          from: {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, rgba(0, 229, 153, 0.1) 0%, rgba(0, 184, 255, 0.1) 100%)',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 229, 153, 0.3)',
        'neon-lg': '0 0 30px rgba(0, 229, 153, 0.6)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 