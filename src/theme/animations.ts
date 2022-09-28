import { css, keyframes } from 'styled-components/macro'

export const fadeIn = keyframes`
from {
  opacity: 0;
}
to {
  opacity: 1;
}
`

export const textFadeIn = css`
  animation: ${fadeIn} 125ms ease-in;
`
