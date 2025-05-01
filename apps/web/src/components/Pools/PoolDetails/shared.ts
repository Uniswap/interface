import { LoadingBubble } from 'components/Tokens/loading'
import styled from 'lib/styled-components'

export const DetailBubble = styled(LoadingBubble)<{ $height?: number; $width?: number }>`
  height: ${({ $height }) => ($height ? `${$height}px` : '16px')};
  width: ${({ $width }) => ($width ? `${$width}px` : '80px')};
`
