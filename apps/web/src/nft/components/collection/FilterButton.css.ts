import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'
import { sprinkles, themeVars, vars } from 'nft/css/sprinkles.css'

export const filterButton = sprinkles({
  backgroundColor: 'accent2',
  color: 'accent1',
})

export const filterButtonExpanded = style({
  background: vars.color.surface1,
  color: themeVars.colors.neutral1,
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: themeVars.colors.surface3,
})

export const filterButtonLoading = style([
  loadingAsset,
  sprinkles({
    height: '44',
    width: '100',
  }),
])
