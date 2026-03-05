import { TextStyle } from 'ui/src'
import { css } from '~/lib/deprecated-styled'

/** @deprecated use tamagui and EllipsisTamaguiStyle instead */
export const EllipsisStyle = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const EllipsisTamaguiStyle = {
  '$platform-web': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
} satisfies TextStyle
