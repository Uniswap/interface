import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'

export const logo = style({
  borderRadius: '12px',
})

export const title = style([
  body,
  {
    color: 'var(--neutral1)',
    textAlign: 'left',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    paddingLeft: '12px',
    paddingRight: '2px',
  },
])

export const address = style([
  title,
  {
    marginLeft: '8px',
    alignItems: 'center',
    minWidth: '0',
    width: 'max-content',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
])

export const verifiedBadge = style({
  marginLeft: '4px',
  display: 'inline-block',
  paddingTop: '4px',
  height: '28px',
  width: '28px',
  textAlign: 'left',
})
