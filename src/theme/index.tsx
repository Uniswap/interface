import React, { useMemo } from 'react'
import styled, {
  ThemeProvider as StyledComponentsThemeProvider,
  createGlobalStyle,
  css,
  DefaultTheme
} from 'styled-components'
import { useIsDarkMode } from '../state/user/hooks'
import { Text, TextProps } from 'rebass'
import { Colors } from './styled'
import 'react-datepicker/dist/react-datepicker.min.css'
import { transparentize } from 'polished'

export * from './components'

export const MEDIA_WIDTHS = {
  upToExtraSmall: 500,
  upToSmall: 720,
  upToMedium: 960,
  upToLarge: 1280
}

const mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(MEDIA_WIDTHS).reduce(
  (accumulator, size) => {
    ;(accumulator as any)[size] = (a: any, b: any, c: any) => css`
      @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
        ${css(a, b, c)}
      }
    `
    return accumulator
  },
  {}
) as any

const white = '#FFFFFF'
const black = '#000000'

export function colors(darkMode: boolean): Colors {
  return {
    // base
    white,
    black,

    // text
    text1: darkMode ? '#FFFFFF' : '#14131D',
    text2: darkMode ? '#EBE9F8' : '#464366',
    text3: darkMode ? '#DDDAF8' : '#8E89C6',
    text4: darkMode ? '#C0BAF6' : '#A7A0E4',
    text5: darkMode ? '#8780BF' : '#C0BAF6',

    // backgrounds / greys
    bg1: darkMode ? '#191A24' : '#FFFFFF',
    bg1And2: darkMode ? '#1D202F' : '#FFFFFF',
    bg2: darkMode ? '#2A2F42' : '#EBE9F8',
    bg3: darkMode ? '#3E4259' : '#DDDAF8',
    bg4: darkMode ? '#686E94' : '#C0BBE9',
    bg5: darkMode ? '#9096BE' : '#7873A4',

    //specialty colors
    modalBG: darkMode ? 'rgba(0,0,0,.425)' : 'rgba(0,0,0,0.3)',
    advancedBG: darkMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.6)',

    //primary colors
    primary1: darkMode ? '#2E17F2' : '#551a8b',
    primary2: darkMode ? '#3680E7' : '#F9F5FF',
    primary3: darkMode ? '#4D8FEA' : '#D4C2FC',
    primary4: darkMode ? '#376bad70' : '#998FC7',
    primary5: darkMode ? '#153d6f70' : '#D6D3D9',

    // color text
    primaryText1: darkMode ? '#6da8ff' : '#551a8b',

    // secondary colors
    secondary1: darkMode ? '#2172E5' : '#551a8b',
    secondary2: darkMode ? '#17000b26' : '#998FC7',
    secondary3: darkMode ? '#17000b26' : '#D4C2FC',

    // other
    red1: '#F02E51',
    red2: '#F82D3A',
    green1: '#27AE60',
    green2: '#0E9F6E',
    yellow1: '#FFE270',
    yellow2: '#F3841E',
    blue1: '#2172E5',

    // dont wanna forget these blue yet
    // blue4: darkMode ? '#153d6f70' : '#C4D9F8',
    // blue5: darkMode ? '#153d6f70' : '#EBF4FF',

    // new UI refactor colors
    mainPurple: '#2E17F2',
    purpleBase: '#101016',
    purpleOverlay: '#111018',
    purple2: '#C0BAF6',
    purple3: '#8780BF',
    purple4: '#685EC6',
    purple5: '#464366',
    boxShadow: '#0A0A0F',

    // darkest // dark 1.1
    darkest: '#161721',
    dark1: '#191824',
    dark2: '#2A2F42'
  }
}

export function theme(darkMode: boolean): DefaultTheme {
  return {
    ...colors(darkMode),

    darkMode,

    grids: {
      sm: 8,
      md: 12,
      lg: 24
    },

    //shadows
    shadow1: darkMode ? '#000' : '#2F80ED',

    // media queries
    mediaWidth: mediaWidthTemplates,

    // css snippets
    flexColumnNoWrap: css`
      display: flex;
      flex-flow: column nowrap;
    `,
    flexRowNoWrap: css`
      display: flex;
      flex-flow: row nowrap;
    `
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useIsDarkMode()

  const themeObject = useMemo(() => theme(darkMode), [darkMode])

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

const TextWrapper = styled(Text)<{ color: keyof Colors }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`

export const TYPE = {
  main(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text2'} {...props} />
  },
  link(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary1'} {...props} />
  },
  black(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text1'} {...props} />
  },
  white(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'white'} {...props} />
  },
  body(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={16} color={'text5'} {...props} />
  },
  largeHeader(props: TextProps) {
    return <TextWrapper fontWeight={600} fontSize={24} {...props} />
  },
  mediumHeader(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={20} {...props} />
  },
  subHeader(props: TextProps) {
    return <TextWrapper fontWeight={400} fontSize={14} {...props} />
  },
  small(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={11} {...props} />
  },
  blue(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'primary1'} {...props} />
  },
  yellow(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'yellow1'} {...props} />
  },
  darkGray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'text3'} {...props} />
  },
  gray(props: TextProps) {
    return <TextWrapper fontWeight={500} color={'bg3'} {...props} />
  },
  italic(props: TextProps) {
    return <TextWrapper fontWeight={500} fontSize={12} fontStyle={'italic'} color={'text2'} {...props} />
  },
  error({ error, ...props }: { error: boolean } & TextProps) {
    return <TextWrapper fontWeight={500} color={error ? 'red1' : 'text2'} {...props} />
  }
}

export const FixedGlobalStyle = createGlobalStyle`
html, input, textarea, button {
  font-family: 'Montserrat', sans-serif;
  font-display: fallback;
}

html,
body {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

button {
  user-select: none;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  
}

a {
  text-decoration: none;
}
`

export const ThemedGlobalStyle = createGlobalStyle`
html {
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1};
  color-scheme: ${props => (props.theme.darkMode ? 'dark' : 'light')};
}

body {
  min-height: 100vh;
  background-position: 0 -20vh;
  background-repeat: no-repeat;
  background-image: ${({ theme }) =>
    `radial-gradient(80vw 100vh at 50vw 0vh, ${transparentize(0.7, theme.text5)} 0%, ${theme.bg1} 100%)`};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    background-position: 0 -10vh;
    background-image: radial-gradient(100vw 50vh at 50vw 50vh, ${transparentize(0.7, theme.text5)} 0%, ${
    theme.bg1
  } 100%);
  `};
}

.react-datepicker-wrapper {
  width: 100%;
}

.react-datepicker {
  font-family: Montserrat !important;
  border: solid 1px ${props => props.theme.bg5} !important;
  border-radius: 8px !important;
  color: ${props => props.theme.text4} !important;
  background-color: ${props => props.theme.dark1} !important;
  background: linear-gradient(113.18deg, rgba(255, 255, 255, 0.35) -0.1%, rgba(0, 0, 0, 0) 98.9%),
  ${({ theme }) => theme.dark1} !important;
  background-blend-mode: overlay, normal !important;
}

.react-datepicker__triangle {
  border-bottom-color: ${props => props.theme.dark1} !important;
}

.react-datepicker__header {
  background-color: transparent !important;
  border-top-left-radius: 8px;
  border-bottom: none !important;
}

.react-datepicker__current-month {
  color: ${props => props.theme.text4} !important;
}

.react-datepicker__day-name {
  color: ${props => props.theme.text4} !important;
  font-weight: 600;
}

.react-datepicker__day.react-datepicker__day--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.react-datepicker__time-container .react-datepicker__time {
  background: transparent !important;
}

.react-datepicker__time-container  {
  border-left: solid 1px ${props => props.theme.bg5} !important;
}

.react-datepicker-time__header  {
  color: ${props => props.theme.bg5} !important;
}

.react-datepicker__time-list-item {
  transition: background-color 0.3s ease;
  :hover:not(.react-datepicker__time-list-item--disabled) {
    background-color: ${props => props.theme.bg2} !important;
  }
}

.react-datepicker__time-list-item.react-datepicker__time-list-item--disabled {
  opacity: 0.5;
  color: ${props => props.theme.text4} !important;
}

.react-datepicker__header.react-datepicker__header--time {
  border-bottom: solid 1px ${props => props.theme.bg5} !important;
}

.react-datepicker__day--keyboard-selected {
  background-color: ${props => props.theme.bg2} !important;
}

.swapr-pagination {
  list-style: none;
}

.swapr-pagination ul {
  display: inline-flex;
}

.swapr-pagination li {
  display: inline-block;
  min-width: 28px;
  height: 22px;
  margin-right: 8px;
  vertical-align: middle;
  list-style: none;
  outline: 0;
  cursor: pointer;
  user-select: none;
  border: solid 1px ${props => props.theme.bg3};
  transition: border 0.3s ease, color 0.3s ease;
  font-size: 14px;
  border-radius: 4px;
  text-align: center;
  line-height: 20px;
  color: ${props => props.theme.text5};
}

.swapr-pagination li.rc-pagination-item-active {
  border: solid 1px ${props => props.theme.bg4};
}

.swapr-pagination li.rc-pagination-prev,
.swapr-pagination li.rc-pagination-next {
  color: ${props => props.theme.white};
  padding-top: 2px;
}

.swapr-pagination li.rc-pagination-options {
  display: none;
}

.swapr-pagination li.rc-pagination-disabled {
  border: solid 1px ${props => props.theme.bg3};
  color: ${props => props.theme.bg3};
}

.custom-toast-root {
    margin-top: 70px;
}

.custom-toast-container {
    box-shadow: 0px 16px 12px ${({ theme }) => transparentize(0.55, theme.boxShadow)};
    border-radius: 12px !important;
}

.custom-toast-body {
    font-family: "Montserrat";
    padding: 4px 8px;
}

.Toastify__toast {
    min-height: auto !important;
    padding: 16px;
}

.Toastify__toast-body {
    margin: 0 !important;
}

.Toastify__close-button {
  position: absolute;
  right: 12px;
  top: 12px;
}

.Toastify__toast--info {
    background: ${props => props.theme.bg1} !important;
}

@media only screen and (max-width: 600px) {
	.Toastify__toast-container--top-right {
	    top: auto !important;
	    bottom: 70px !important;
	    left: 12px !important;
	    right: 12px !important;
	}
	
  .Toastify__toast-container {
	    width: auto !important;
	}
}

.rc-pagination-simple-pager {
  padding: 0 8px;
}

.rc-pagination-slash {
  margin-right: 4px;
}

.rc-pagination-simple-pager > input {
  background-color: transparent;
  outline: none;
  border: none;
  color: ${props => props.theme.text5};
}


.walletconnect-modal__mobile__toggle a {
  color: rgb(64, 153, 255);
}
`
