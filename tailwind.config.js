/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: '#000000',
        card: '#121212',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-calories': 'linear-gradient(to right, #f97316, #eab308)',
        'gradient-carbs': 'linear-gradient(to right, #ec4899, #ef4444)',
        'gradient-fats': 'linear-gradient(to right, #eab308, #f97316)',
        'gradient-protein': 'linear-gradient(to right, #60a5fa, #1e40af)',
        'gradient-water': 'linear-gradient(to right, #94a3b8, #64748b)',
      },
      boxShadow: {
        'card-glow': '0 0 0 1px rgba(255,255,255,0.03), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
}
