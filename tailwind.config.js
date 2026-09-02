/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'app/assets/svg/*.svg',
    'app/components/**/*.vue',
    'app/layouts/**/*.vue',
    'app/pages/**/*.vue',
    'app/plugins/**/*.js',
    'nuxt.config.ts'
  ],
  theme: {
    fontFamily: {
      body: ['Rubik'],
      roboto: ['Roboto']
    },
    extend: {
      colors: {
        link: '#CE0000',
        background: '#F8FAFB',
        'light-gray': '#E5E5E5',
        'dark-gray': '#D5D5D5',
        'divider-gray': '#C4C4C4',
        white: '#FFFFFF',
        icon: '#A9A9A9',
        'gray-900': '#1a202c',
        button: '#d5d5d5',
        'action-button': '#5BB46F',
        'warning-button': '#D00505',
        filter: '#E6EEF5',
        'filter-active': '#2CDDCB',
        'filter-text': '#99A8B8',
        'input-border': '#D4DDE7',
        label: '#6A7E90',
        'icon-text': '#5BB46F',
        'page-title': '#556472',
        'table-title': '#30373E',
        warning: '#D00505',
        info: '#2ECC71',
        alert: '#F4CA64',
        'info-background': '#FCF7E8',
        'info-text': '#BF8B0D',
        avatar: '#F4FDF6',
        'bar-icon': '#ABC1D9',
        'info-icon': '#B1C1D3',
        tooltip: '#253749',
        'tooltip-border': '#1F2E3D'
      }
    },
    minWidth: {
      icon: '50px'
    },
    minHeight: {
      icon: '50px'
    },
    boxShadow: {
      standard: '0 4px 6px rgba(153, 168, 184, 0.1)',
      stack: '0 4px 4px 1px rgba(153, 168, 184, 0.3)'
    }
  },
  variants: {},
  plugins: []
}
