import styled, { keyframes } from 'styled-components/macro'

const pulse = keyframes`
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
`

export const LoadingBar = styled.div<{ width: number; height: number }>`
  animation: ${pulse} 1s ease-in-out infinite alternate;
  background-color: ${({ theme }) => theme.bg3};
  border-radius: 0.125rem;
  height: ${({ height }) => `${height}px`};
  width: ${({ width }) => `${width}px`};
`
