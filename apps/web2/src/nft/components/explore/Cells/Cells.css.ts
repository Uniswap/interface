import { style } from '@vanilla-extract/css'

import { body } from '../../../css/common.css'
import { sprinkles } from '../../../css/sprinkles.css'

export const logo = sprinkles({ borderRadius: '12' })

export const title = style([
  body,
  sprinkles({
    color: 'neutral1',
    textAlign: 'left',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    paddingLeft: '12',
    paddingRight: '2',
  }),
])

export const address = style([
  title,
  sprinkles({
    marginLeft: '8',
    alignItems: 'center',
    minWidth: '0',
    width: 'max',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  }),
])

export const verifiedBadge = sprinkles({
  marginLeft: '4',
  display: 'inline-block',
  paddingTop: '4',
  height: '28',
  width: '28',
  textAlign: 'left',
})
