import { loadingAnimation } from 'components/Loader/styled'
import { darken } from 'polished'
import styled from 'styled-components/macro'

/* Loading state bubbles (animation style from: src/components/Loader/styled.tsx) */
export const LoadingBubble = styled.div`
  border-radius: 12px;
  height: 24px;
  width: 50%;
  animation: ${loadingAnimation} 1.5s infinite;
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.backgroundContainer} 25%,
    ${({ theme }) => darken(0.8, theme.backgroundContainer)} 50%,
    ${({ theme }) => theme.backgroundContainer} 75%
  );
  will-change: background-position;
  background-size: 400%;
`
