import { TextStyle } from 'ui/src'

export const EllipsisTamaguiStyle = {
  '$platform-web': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
} satisfies TextStyle
