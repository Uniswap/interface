import { css } from 'lib/styled-components'
import { TextStyle } from 'ui/src'

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
