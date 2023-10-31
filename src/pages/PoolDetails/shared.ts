import { LoadingBubble } from 'components/Tokens/loading'
import styled from 'styled-components'

export const DetailBubble = styled(LoadingBubble)<{ $height?: number; $width?: number }>`
  height: ${({ $height }) => ($height ? `${$height}px` : '16px')};
  width: ${({ $width }) => ($width ? `${$width}px` : '80px')};
`

export const SmallDetailBubble = styled(LoadingBubble)`
  height: 20px;
  width: 20px;
  border-radius: 100px;
`
