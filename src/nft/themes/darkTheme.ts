import { Theme, vars } from 'nft/css/sprinkles.css'

export const darkTheme: Theme = {
  colors: {
    accentFailure: vars.color.red300,
    accentFailureSoft: 'rgba(253, 118, 107, 0.12)',
    accentAction: vars.color.blue400,
    accentActionSoft: 'rgba(76, 130, 251, 0.24)',
    accentSuccess: vars.color.green200,

    explicitWhite: '#FFFFFF',
    green: vars.color.green200,
    gold: vars.color.gold200,
    violet: vars.color.violet200,

    backgroundFloating: '0000000C',
    backgroundInteractive: vars.color.gray700,
    backgroundModule: vars.color.gray800,
    backgroundOutline: vars.color.backgroundInteractive,
    backgroundSurface: vars.color.gray900,
    backgroundBackdrop: vars.color.gray950,

    modalBackdrop: 'linear-gradient(0deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',

    searchBackground: `rgba(255,255,255,0.07)`,
    searchOutline: `rgba(255,255,255,0.07)`,
    stateOverlayHover: `rgba(153,161,189,0.08)`,

    textPrimary: '#FFFFFF',
    textSecondary: vars.color.gray300,
    textTertiary: vars.color.gray500,

    dropShadow: `0px 4px 16px rgba(76, 130, 251, 0.4)`,
  },
  shadows: {
    menu: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    elevation: '0px 4px 16px rgba(70, 115, 250, 0.4)',
    tooltip: '0px 4px 16px rgba(255, 255, 255, 0.2)',
    deep: '12px 16px 24px rgba(0, 0, 0, 0.24), 12px 8px 12px rgba(0, 0, 0, 0.24), 4px 4px 8px rgba(0, 0, 0, 0.32)',
    shallow: '4px 4px 10px rgba(0, 0, 0, 0.24), 2px 2px 4px rgba(0, 0, 0, 0.12), 1px 2px 2px rgba(0, 0, 0, 0.12)',
  },
  opacity: {
    hover: '0.6',
    pressed: '0.4',
  },
}
