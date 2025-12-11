import { LoadingBubble } from 'components/Tokens/loading'
import { deprecatedStyled } from 'lib/styled-components'

export const DetailBubble = deprecatedStyled(LoadingBubble)<{ $height?: number; $width?: number }>`
  height: ${({ $height }) => ($height ? `${$height}px` : '16px')};
  width: ${({ $width }) => ($width ? `${$width}px` : '80px')};
`
