import { style } from '@vanilla-extract/css'
import { buttonTextMedium } from 'nft/css/common.css'
import { loadingAsset } from 'nft/css/loading.css'
import { sprinkles, vars } from 'nft/css/sprinkles.css'

export const baseActivityContainer = style([
  {
    borderBottom: '1px solid',
    borderColor: vars.color.backgroundInteractive,
  },
])

export const baseActivitySwitcherToggle = style([
  buttonTextMedium,
  sprinkles({
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  }),
  {
    lineHeight: '24px',
    marginBottom: '8px',
  },
])

export const activitySwitcherToggle = style([
  baseActivitySwitcherToggle,
  sprinkles({
    color: 'textSecondary',
  }),
])

export const selectedActivitySwitcherToggle = style([
  baseActivitySwitcherToggle,
  sprinkles({
    color: 'textPrimary',
  }),
  {
    ':after': {
      content: '',
      position: 'absolute',
      background: vars.color.genieBlue,
      width: '100%',
      height: '2px',
      left: '0px',
      right: '0px',
      bottom: '-9px',
    },
  },
])

export const styledLoading = style([
  loadingAsset,
  {
    width: 58,
    height: 20,
  },
])
