import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const filterButton = sprinkles({
  backgroundColor: 'blue400',
  color: 'explicitWhite',
})

export const filterButtonExpanded = style({
  background: vars.color.backgroundInteractive,
  color: themeVars.colors.textPrimary,
})

export const filterBadge = style([
  sprinkles({
    position: 'absolute',
    left: '18',
    fontSize: '28',
  }),
  {
    top: '-3px',
  },
])

export const filterButtonLoading = style([
  loadingAsset,
  sprinkles({
    height: '44',
    width: '100',
  }),
])
