import { css, deprecatedStyled, keyframes } from 'lib/styled-components'

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

export const StyledSVG = deprecatedStyled.svg<{ size: string; stroke?: string; fill?: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
  path {
    stroke: ${({ stroke }) => stroke};
    background: ${({ theme }) => theme.neutral2};
    fill: ${({ fill }) => fill};
  }
`

export const StyledRotatingSVG = deprecatedStyled(StyledSVG)`
  ${RotationStyle}
`
