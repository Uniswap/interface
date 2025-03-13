import { style } from '@vanilla-extract/css'
import { loadingAsset } from 'nft/css/loading.css'

export const filterButton = style({
  backgroundColor: 'var(--accent2)',
  color: 'var(--accent1)',
})

export const filterButtonExpanded = style({
  background: 'var(--surface1)',
  color: 'var(--neutral1)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--surface3)',
})

export const filterButtonLoading = style([
  loadingAsset,
  {
    height: '44px',
    width: '100px',
  },
])
