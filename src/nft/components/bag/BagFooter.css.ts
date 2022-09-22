import { style } from '@vanilla-extract/css'
import { body } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const footerContainer = sprinkles({
  marginTop: '20',
  paddingX: '16',
})

export const footer = style([
  sprinkles({
    background: 'lightGray',
    color: 'blackBlue',
    paddingX: '16',
    paddingY: '12',
    borderBottomLeftRadius: '12',
    borderBottomRightRadius: '12',
  }),
])

export const warningContainer = style([
  sprinkles({
    paddingY: '12',
    borderTopLeftRadius: '12',
    borderTopRightRadius: '12',
    justifyContent: 'center',
    fontSize: '12',
    fontWeight: 'semibold',
  }),
  {
    color: '#EEB317',
    background: '#EEB3173D',
    lineHeight: '12px',
  },
])

export const payButton = style([
  body,
  sprinkles({
    background: 'blue400',
    color: 'blackBlue',
    border: 'none',
    borderRadius: '12',
    paddingY: '12',
    fontWeight: 'semibold',
    cursor: 'pointer',
    justifyContent: 'center',
    gap: '16',
  }),
  {
    ':disabled': {
      opacity: '0.6',
      cursor: 'auto',
    },
  },
])

export const ethPill = style([
  sprinkles({
    background: 'lightGray',
    gap: '8',
    paddingY: '4',
    paddingLeft: '4',
    paddingRight: '12',
    fontSize: '20',
    fontWeight: 'semibold',
    borderRadius: 'round',
  }),
  {
    lineHeight: '24px',
  },
])
