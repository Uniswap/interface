import styled, { css, keyframes } from 'styled-components/macro'

const rotateAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const RotationStyle = css`
  animation: 2s ${rotateAnimation} linear infinite;
`

export const StyledSVG = styled.svg<{ size: string; stroke?: string; fill?: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
  path {
    stroke: ${({ stroke }) => stroke};
    background: ${({ theme }) => theme.textSecondary};
    fill: ${({ fill }) => fill};
  }
`

export const StyledRotatingSVG = styled(StyledSVG)`
  ${RotationStyle}
`
