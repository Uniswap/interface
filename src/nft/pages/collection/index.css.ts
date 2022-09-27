import { style } from '@vanilla-extract/css'
import { buttonTextMedium } from 'nft/css/common.css'
import { loadingBlock } from 'nft/css/loading.css'

import { sprinkles, vars } from '../../css/sprinkles.css'

export const bannerContainerNoBanner = style({ height: '0', marginTop: '0px' })

export const bannerImage = style({ objectFit: 'cover' })

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
      bottom: '-8px',
    },
  },
])

export const loadingBanner = style([
  loadingBlock,
  sprinkles({
    width: 'full',
    height: '100',
  }),
])

export const noCollectionAssets = sprinkles({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '40',
})
