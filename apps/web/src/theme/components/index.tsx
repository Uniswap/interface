import styled, { css, keyframes } from 'lib/styled-components'
import { AlertTriangle } from 'react-feather'

// TODO: Break this file into a components folder

export { ThemedText } from './text'

export const ButtonText = styled.button`
  outline: none;
  border: none;
  font-size: inherit;
  padding: 0;
  margin: 0;
  background: none;
  cursor: pointer;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  transition-timing-function: ease-in-out;
  transition-property: opacity, color, background-color;

  @media (hover: hover) and (pointer: fine) {
    :hover {
      opacity: ${({ theme }) => theme.opacity.hover};
    }
  }

  :focus {
    text-decoration: underline;
  }
`

const rotateImg = keyframes`
  0% {
    transform: perspective(1000px) rotateY(0deg);
  }

  100% {
    transform: perspective(1000px) rotateY(360deg);
  }
`

export const UniTokenAnimated = styled.img`
  animation: ${rotateImg} 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  padding: 2rem 0 0 0;
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`
const SpinnerCss = css`
  animation: 2s ${rotate} linear infinite;
`

const Spinner = styled.img`
  ${SpinnerCss}
  width: 16px;
  height: 16px;
`
export const SpinnerSVG = styled.svg`
  ${SpinnerCss}
`

export const CustomLightSpinner = styled(Spinner)<{ size: string }>`
  height: ${({ size }) => size};
  width: ${({ size }) => size};
`

export const MediumOnly = styled.span`
  display: none;
  @media (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: block;
  }
`

export const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.surface3};
`

export const CautionTriangle = styled(AlertTriangle)`
  color: ${({ theme }) => theme.deprecated_accentWarning};
`

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  border-width: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.surface3};
`
