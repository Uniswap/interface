import styled, { keyframes } from 'styled-components/macro'

import { CSpinner } from '@coreui/react'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const StyledSVG = styled.svg<{ size: string; stroke?: string }>`
  animation: 2s ${rotate} linear infinite;
  height: ${({ size }) => size};
  width: ${({ size }) => size};
  path {
    stroke: ${({ stroke, theme }) => stroke ?? theme.primary1};
  }
`

/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
export default function Loader({
  size = 'sm',
  stroke,
  ...rest
}: {
  size?: 'sm' | undefined | string
  stroke?: string
  [k: string]: any
}) {
  return (
    <CSpinner {...rest}  component="span" size={size as 'sm' | undefined} aria-hidden="true"/>
  )
}
