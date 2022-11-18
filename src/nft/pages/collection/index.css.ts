import { style } from '@vanilla-extract/css'
import {
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Tokens/constants'
import { buttonTextMedium } from 'nft/css/common.css'
import { loadingBlock } from 'nft/css/loading.css'
import { css } from 'styled-components/macro'

import { sprinkles, vars } from '../../css/sprinkles.css'

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

export const ScreenBreakpointsPaddings = css`
  @media screen and (min-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    padding-left: 48px;
    padding-right: 48px;
  }

  @media screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    padding-left: 26px;
    padding-right: 26px;
  }

  @media screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding-left: 20px;
    padding-right: 20px;
  }

  @media screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    padding-left: 16px;
    padding-right: 16px;
  }
`
