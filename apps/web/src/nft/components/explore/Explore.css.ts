import { style } from '@vanilla-extract/css'
import { body, bodySmall } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const section = style([
  sprinkles({
    paddingLeft: { sm: '16', xl: '0' },
    paddingRight: { sm: '16', xl: '0' },
  }),
  {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    position: 'relative',
  },
])

/* Activity Feed Styles */
export const activityRow = style([
  sprinkles({
    position: 'absolute',
    alignItems: { sm: 'flex-start', lg: 'center' },
  }),
  {
    transition: 'transform 0.4s ease',
  },
])

export const activeRow = sprinkles({
  backgroundColor: 'gray800',
})

export const timestamp = style([
  sprinkles({
    position: 'absolute',
    fontSize: '12',
    color: 'gray300',
    right: { sm: 'unset', lg: '12' },
    left: { sm: '64', lg: 'unset' },
    top: { sm: '28', lg: 'unset' },
  }),
])

export const marketplaceIcon = style([
  sprinkles({
    width: '16',
    height: '16',
    borderRadius: '4',
    flexShrink: '0',
    marginLeft: '8',
  }),
  {
    verticalAlign: 'bottom',
  },
])

/* Base Table Styles  */

export const table = style([
  {
    borderCollapse: 'collapse',
    boxShadow: '0 0 0 1px rgba(153, 161, 189, 0.24)',
    borderSpacing: '0px 40px',
  },
  sprinkles({
    background: 'surface1',
    width: 'full',
    borderRadius: '12',
    borderStyle: 'none',
  }),
])

export const thead = sprinkles({
  marginRight: '12',
  borderColor: 'surface3',
  borderWidth: '1px',
  borderBottomStyle: 'solid',
})

export const th = style([
  bodySmall,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    color: { default: 'neutral2' },
    paddingTop: '12',
    paddingBottom: '12',
  }),
])

export const td = style([
  body,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    maxWidth: '160',
    paddingY: '4',
    textAlign: 'right',
    position: 'relative',
  }),
])

export const loadingTd = style([
  body,
  {
    selectors: {
      '&:nth-last-child(1)': {
        paddingRight: '20px',
      },
    },
  },
  sprinkles({
    maxWidth: '160',
    paddingY: '8',
    textAlign: 'right',
    position: 'relative',
  }),
])
