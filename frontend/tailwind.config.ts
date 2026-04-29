import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── MADHURA: Replace these with your final color tokens ──────────────
      colors: {
        // Background layers
        bg: {
          base:    '#0F0F1A',   // page background
          surface: '#1A1A2E',   // cards, panels
          elevated:'#252540',   // modals, dropdowns
        },
        // Brand color (Madhura picks: purple or teal)
        primary: {
          DEFAULT: '#7C3AED',
          hover:   '#6D28D9',
          light:   '#A78BFA',
        },
        // Borders
        border: {
          DEFAULT: '#2E2E50',
          light:   '#3E3E60',
        },
        // Text
        text: {
          primary: '#F8F8FC',
          muted:   '#8888AA',
          accent:  '#A78BFA',
        },
        // Status
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        // Agent type badge colors
        agent: {
          trading:     '#3B82F6',
          farming:     '#10B981',
          scheduling:  '#8B5CF6',
          rebalancing: '#F59E0B',
          content:     '#EC4899',
          business:    '#6366F1',
        },
      },
      fontFamily: {
        // MADHURA: Inter loaded via next/font in layout.tsx
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // Spacing scale: 4/8/12/16/24/32/48/64px
      borderRadius: {
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card:    '0 4px 24px rgba(0,0,0,0.4)',
        glow:    '0 0 20px rgba(124,58,237,0.3)',
        'glow-sm': '0 0 10px rgba(124,58,237,0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
