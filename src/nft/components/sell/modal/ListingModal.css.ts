import { style } from '@vanilla-extract/css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const chevron = style([
  sprinkles({
    height: '28',
    width: '28',
    transition: '250',
    marginLeft: 'auto',
    marginRight: '0',
  }),
])

export const chevronDown = style({
  transform: 'rotate(180deg)',
})

export const sectionDivider = style([
  sprinkles({
    borderRadius: '20',
    marginTop: '8',
    width: 'full',
    borderWidth: '0.5px',
    borderStyle: 'solid',
    borderColor: 'backgroundOutline',
  }),
])

export const button = style([
  sprinkles({
    height: '40',
    width: 'full',
    textAlign: 'center',
    fontWeight: 'medium',
    fontSize: '14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    borderRadius: '12',
  }),
  {
    lineHeight: '18px',
  },
])

export const listingModalIcon = style([
  sprinkles({
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'backgroundSurface',
  }),
  {
    boxSizing: 'border-box',
    marginLeft: '-2px',
  },
])

export const warningTooltip = style([
  sprinkles({
    paddingTop: '8',
    paddingRight: '8',
    paddingBottom: '8',
    paddingLeft: '12',
  }),
  {
    boxShadow: '0px 4px 16px rgba(10, 10, 59, 0.2)',
  },
])

export const listingSectionBorder = style([
  sprinkles({
    padding: '8',
    borderRadius: '8',
    borderColor: 'backgroundOutline',
    borderStyle: 'solid',
    borderWidth: '1px',
  }),
])
