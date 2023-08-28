import { style } from '@vanilla-extract/css'
import { buttonTextSmall } from 'nft/css/common.css'
import { sprinkles } from 'nft/css/sprinkles.css'

export const bagContainer = style([
  sprinkles({
    position: 'fixed',
    bottom: '72',
    left: '16',
    right: '16',
    background: 'surface2',
    padding: '8',
    zIndex: 'dropdown',
    borderRadius: '8',
    borderStyle: 'solid',
    borderColor: 'surface3',
    borderWidth: '1px',
    justifyContent: 'space-between',
  }),
])

export const viewBagButton = style([
  buttonTextSmall,
  sprinkles({
    color: 'white',
    backgroundColor: 'accent1',
    paddingY: '8',
    paddingX: '18',
    borderRadius: '12',
    cursor: 'pointer',
  }),
])
