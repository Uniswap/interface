import { rgba, lighten, darken, transparentize } from "polished";

const colorList = [
    'slateblue',
    'goldenrod',
    'royalblue',
    'orangered',
];

const themeConfig = {
    accent: '#304FFE',
    randomAccent: false,
    colorList: colorList,
}

const basicPalette = {
    'black': '#000000',
    'white': '#FFFFFF',
    'background': 'rgba(12, 11, 18, 1)',
    'accent': 
        themeConfig.randomAccent ? 
            colorList[getRandomInt(colorList.length - 1)] : themeConfig.accent,
    'blueGray': 'rgba(135, 128, 191, 1)',
    'gray': 'rgba(183, 181, 203, 1)'
};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
};

const expandedPalette = {
    ...basicPalette,
    'accentLight': () => (lighten(0.025, basicPalette.accent)),
    'accentExtraLight': () => (lighten(0.2, basicPalette.accent)),
    'gray600':     () => (lighten(0.15, basicPalette.black)),
    'gray500':     () => (lighten(0.22, basicPalette.black)),
    'gray400':     () => (lighten(0.35, basicPalette.black)),
    'gray300':     () => (lighten(0.5, basicPalette.black)),
    'gray100':     () => (lighten(0.1, basicPalette.black)),
    'blue500':     () => (darken(0.4, basicPalette.blue)),
    'purple500':   () => (darken(0.4, basicPalette.purple)),
};

const theme = {
    ...basicPalette,
    ...expandedPalette
}

export const breakpoints = {
    'xs': '416px',
    's': '600px',
    'md': '959px',
    'l': '1360px',
    'xl': '1620px'
}

export const boxShadow = {
    'md': `0 0 10px ${transparentize(0.4, basicPalette.black)}`,
    'l': `0 0 30px ${transparentize(0.6, basicPalette.black)}`
}

export const gradients = {
    'primary': 'linear-gradient(270deg, #FFFFFF 1.98%, #DCD8FE 95.72%)',
    'primaryLabel': 'linear-gradient(90.22deg, #3C0FEF 0.62%, #B300FF 105.85%)',
    'cta': 'linear-gradient(266.97deg, #D74DFF 5.64%, #8E38FF 53.85%, #4C1DFF 97.29%)',
    'heroMainText': 'linear-gradient(270deg, #FFFFFF 1.98%, #DCD8FE 95.72%)'
}

export default theme;

