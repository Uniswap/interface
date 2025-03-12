import { style } from '@vanilla-extract/css'
import { buttonTextMedium } from 'nft/css/common.css'
import { loadingAsset } from 'nft/css/loading.css'

export const baseActivitySwitcherToggle = style([
  buttonTextMedium,
  {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '8px',
    lineHeight: '24px',
  },
])

export const activitySwitcherToggle = style([
  baseActivitySwitcherToggle,
  {
    color: 'var(--neutral2)',
  },
])

export const selectedActivitySwitcherToggle = style([
  baseActivitySwitcherToggle,
  {
    color: 'var(--neutral1)',
    ':after': {
      content: '',
      position: 'absolute',
      background: 'var(--neutral1)',
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
    width: '58px',
    height: '20px',
  },
])
