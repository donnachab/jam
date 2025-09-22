module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-accent)',
        accent: 'var(--color-accent-2)',
        green: 'var(--color-green)',
        red: 'var(--color-red)',
        orange: 'var(--color-orange)',
        yellow: 'var(--color-yellow)',
        blue: 'var(--color-blue)',
        white: 'var(--color-white)',
        'grey-lightest': 'var(--color-grey-lightest)',
        'grey-lighter': 'var(--color-grey-lighter)',
        'grey-light': 'var(--color-grey-light)',
        'grey-medium': 'var(--color-grey-medium)',
        'grey-dark': 'var(--color-grey-dark)',
        black: 'var(--color-black)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['georgia', 'Times New Roman', 'times', 'serif'],
      }
    },
  },
  plugins: [],
}