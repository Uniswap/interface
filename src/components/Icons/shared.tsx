import styled, { keyframes } from 'styled-components/macro'

const rotateAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const RotationStyle = styled.svg<{ size: string; stroke: string }>`
  animation: 2s ${rotateAnimation} linear infinite;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  stroke: ${(props) => props.stroke};

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(359deg);
    }
  }
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

export const GifLoaderWrapper = styled.div<{ size: string }>`
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`
