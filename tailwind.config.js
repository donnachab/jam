module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-interactive-primary-bg)',
        accent: 'var(--color-background-accent)',
        green: 'var(--color-interactive-success-bg)',
        red: 'var(--color-interactive-danger-bg)',
        orange: 'var(--color-orange)',
        yellow: 'var(--color-yellow)',
        blue: 'var(--color-interactive-info-bg)',
        white: 'var(--color-white)',
        'grey-lightest': 'var(--color-gray-100)',
        'grey-lighter': 'var(--color-gray-200)',
        'grey-light': 'var(--color-gray-300)',
        'grey-medium': 'var(--color-gray-400)',
        'grey-dark': 'var(--color-gray-600)',
        black: 'var(--color-black)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['georgia', 'Times New Roman', 'times', 'serif'],
        secondary: ['georgia', 'Times New Roman', 'times', 'serif'],
        primary: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}