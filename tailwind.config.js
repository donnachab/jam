module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        accent: 'var(--accent-color)',
        background: 'var(--background-color)',
        'text-dark': 'var(--text-dark)',
        'text-light': 'var(--text-light)',
      }
    },
  },
  plugins: [],
}