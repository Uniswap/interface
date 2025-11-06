import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './registry/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        basel: ['var(--font-basel)', 'sans-serif'],
        baselBook: [
          'Basel Grotesk Book',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        baselMedium: [
          'Basel Grotesk Medium',
          '-apple-system',
          'system-ui',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['InputMono-Regular', 'monospace'],
      },
      fontWeight: {
        book: '485',
        medium: '535',
      },
      screens: {
        xxs: '360px',
        xs: '380px',
        sm: '450px',
        md: '640px',
        lg: '768px',
        xl: '1024px',
        xxl: '1280px',
        xxxl: '1536px',
        'h-short': { raw: '(max-height: 736px)' },
        'h-mid': { raw: '(max-height: 800px)' },
      },
      fontSize: {
        // Headings
        'heading-1': [
          '52px',
          {
            lineHeight: '60px',
            letterSpacing: '-0.02em',
            fontWeight: '485',
          },
        ],
        'heading-2': [
          '36px',
          {
            lineHeight: '44px',
            letterSpacing: '-0.01em',
            fontWeight: '485',
          },
        ],
        'heading-3': [
          '24px',
          {
            lineHeight: '32px',
            letterSpacing: '-0.005em',
            fontWeight: '485',
          },
        ],
        // Subheadings
        'subheading-1': [
          '18px',
          {
            lineHeight: '24px',
            fontWeight: '485',
          },
        ],
        'subheading-2': [
          '16px',
          {
            lineHeight: '24px',
            fontWeight: '485',
          },
        ],
        // Body
        'body-1': [
          '18px',
          {
            lineHeight: '24px',
            fontWeight: '485',
          },
        ],
        'body-2': [
          '16px',
          {
            lineHeight: '24px',
            fontWeight: '485',
          },
        ],
        'body-3': [
          '14px',
          {
            lineHeight: '20px',
            fontWeight: '485',
          },
        ],
        'body-4': [
          '12px',
          {
            lineHeight: '16px',
            fontWeight: '485',
          },
        ],
        // Button Labels
        'button-1': [
          '18px',
          {
            lineHeight: '24px',
            fontWeight: '535',
          },
        ],
        'button-2': [
          '16px',
          {
            lineHeight: '24px',
            fontWeight: '535',
          },
        ],
        'button-3': [
          '14px',
          {
            lineHeight: '20px',
            fontWeight: '535',
          },
        ],
        'button-4': [
          '12px',
          {
            lineHeight: '16px',
            fontWeight: '535',
          },
        ],
      },
      colors: {
        // Base colors
        white: '#FFFFFF',
        black: '#000000',

        // Semantic colors for light theme
        background: {
          DEFAULT: '#FFFFFF', // colors.white
          dark: '#000000', // colors.black
        },

        // Neutral colors with semantic naming
        neutral1: {
          DEFAULT: '#222222', // neutral1_light
          dark: '#FFFFFF', // neutral1_dark
        },
        neutral2: {
          DEFAULT: '#7D7D7D', // neutral2_light
          dark: '#9B9B9B', // neutral2_dark
        },
        neutral3: {
          DEFAULT: '#CECECE', // neutral3_light
          dark: '#5E5E5E', // neutral3_dark
        },

        // Surface colors with semantic naming
        surface1: {
          DEFAULT: '#FFFFFF', // surface1_light
          dark: '#131313', // surface1_dark
          hovered: {
            DEFAULT: '#F5F5F5', // surface1_hovered_light
            dark: '#181818', // surface1_hovered_dark
          },
        },
        surface2: {
          DEFAULT: '#F9F9F9', // surface2_light
          dark: '#1B1B1B', // surface2_dark
          hovered: {
            DEFAULT: '#F2F2F2', // surface2_hovered_light
            dark: '#242424', // surface2_hovered_dark
          },
        },
        surface3: {
          DEFAULT: '#22222212', // surface3_light
          dark: '#FFFFFF12', // surface3_dark
          hovered: {
            DEFAULT: 'rgba(34, 34, 34, 0.12)', // surface3_hovered_light
            dark: 'rgba(255, 255, 255, 0.16)', // surface3_hovered_dark
          },
        },
        surface4: {
          DEFAULT: '#FFFFFF64', // surface4_light
          dark: '#FFFFFF20', // surface4_dark
        },
        surface5: {
          DEFAULT: '#00000004', // surface5_light
          dark: '#00000004', // surface5_dark
        },

        // Accent colors with semantic naming
        accent1: {
          DEFAULT: '#FC72FF', // accent1_light
          dark: '#FC72FF', // accent1_dark
        },
        accent2: {
          DEFAULT: '#FFEFFF', // accent2_light
          dark: '#311C31', // accent2_dark
        },
        accent3: {
          DEFAULT: '#4C82FB', // accent3_light
          dark: '#4C82FB', // accent3_dark
        },

        // Token colors
        token0: {
          DEFAULT: '#FC72FF', // token0 in light theme
          dark: '#FC72FF', // token0 in dark theme
        },
        token1: {
          DEFAULT: '#4C82FB', // token1 in light theme
          dark: '#4C82FB', // token1 in dark theme
        },

        // Status colors
        success: {
          DEFAULT: '#40B66B', // success
        },
        critical: {
          DEFAULT: '#FF5F52', // critical
          secondary: {
            DEFAULT: '#FFF2F1', // critical2_light
            dark: '#2E0805', // critical2_dark
          },
        },
        warning: {
          DEFAULT: '#EEB317', // gold200
        },

        // Network colors
        network: {
          ethereum: '#627EEA',
          optimism: '#FF0420',
          polygon: '#A457FF',
          arbitrum: '#28A0F0',
          bsc: '#F0B90B',
          base: '#0052FF',
          blast: '#FCFC03',
        },

        // Gray palette
        gray: {
          50: '#F5F6FC',
          100: '#E8ECFB',
          150: '#D2D9EE',
          200: '#B8C0DC',
          250: '#A6AFCA',
          300: '#98A1C0',
          350: '#888FAB',
          400: '#7780A0',
          450: '#6B7594',
          500: '#5D6785',
          550: '#505A78',
          600: '#404A67',
          650: '#333D59',
          700: '#293249',
          750: '#1B2236',
          800: '#131A2A',
          850: '#0E1524',
          900: '#0D111C',
          950: '#080B11',
        },

        // Pink palette
        pink: {
          50: '#F9ECF1',
          100: '#FFD9E4',
          200: '#FBA4C0',
          300: '#FF6FA3',
          400: '#FB118E',
          500: '#C41969',
          600: '#8C0F49',
          700: '#55072A',
          800: '#350318',
          900: '#2B000B',
          vibrant: '#F50DB4',
          base: '#FC74FE',
        },

        // Red palette
        red: {
          50: '#FAECEA',
          100: '#FED5CF',
          200: '#FEA79B',
          300: '#FD766B',
          400: '#FA2B39',
          500: '#C4292F',
          600: '#891E20',
          700: '#530F0F',
          800: '#380A03',
          900: '#240800',
          vibrant: '#F14544',
        },

        // Additional color palettes
        yellow: {
          50: '#F6F2D5',
          100: '#DBBC19',
          200: '#DBBC19',
          300: '#BB9F13',
          400: '#A08116',
          500: '#866311',
          600: '#5D4204',
          700: '#3E2B04',
          800: '#231902',
          900: '#180F02',
          vibrant: '#FAF40A',
        },

        green: {
          50: '#E3F3E6',
          100: '#BFEECA',
          200: '#76D191',
          300: '#40B66B',
          400: '#209853',
          500: '#0B783E',
          600: '#0C522A',
          700: '#053117',
          800: '#091F10',
          900: '#09130B',
          vibrant: '#5CFE9D',
        },

        blue: {
          50: '#EDEFF8',
          100: '#DEE1FF',
          200: '#ADBCFF',
          300: '#869EFF',
          400: '#4C82FB',
          500: '#1267D6',
          600: '#1D4294',
          700: '#09265E',
          800: '#0B193F',
          900: '#040E34',
          vibrant: '#587BFF',
        },

        gold: {
          200: '#EEB317',
          400: '#B17900',
          vibrant: '#FEB239',
        },

        magenta: {
          300: '#FD82FF',
          vibrant: '#FC72FF',
        },

        purple: {
          300: '#8440F2',
          900: '#1C0337',
          vibrant: '#6100FF',
        },

        // Legacy colors mapping (for compatibility)
        border: '#F9F9F9',
        input: '#F9F9F9',
        ring: '#222222',
        foreground: '#222222',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#222222',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#222222',
        },
        primary: {
          DEFAULT: '#222222',
          foreground: '#F9F9F9',
        },
        secondary: {
          DEFAULT: '#F9F9F9',
          foreground: '#222222',
        },
        muted: {
          DEFAULT: '#F9F9F9',
          foreground: '#7D7D7D',
        },
        destructive: {
          DEFAULT: '#FF5F52',
          foreground: '#F9F9F9',
        },
        scrim: 'rgba(0, 0, 0, 0.60)',
      },
      borderRadius: {
        none: '0px',
        rounded4: '4px',
        rounded6: '6px',
        rounded8: '8px',
        rounded12: '12px',
        rounded16: '16px',
        rounded20: '20px',
        rounded24: '24px',
        rounded32: '32px',
        roundedFull: '999999px',
      },
      boxShadow: {
        short: 'var(--shadow-short)',
        medium: 'var(--shadow-medium)',
        large: 'var(--shadow-large)',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config
