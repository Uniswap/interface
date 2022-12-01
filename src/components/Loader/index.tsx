import styled, { keyframes } from 'styled-components'

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
    stroke: ${({ stroke, theme }) => stroke ?? theme.primary};
  }
`

/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
export default function Loader({
  size = '16px',
  stroke,
  strokeWidth = '2.5',
  ...rest
}: {
  size?: string
  stroke?: string
  strokeWidth?: string
  [k: string]: any
}) {
  const sWN = Number(strokeWidth)
  // viewbox for stroke width:
  // stroke width = 1 => viewbox = 1.5 1.5 21 21
  // stroke width = 2 => viewbox = 1 1 22 22
  // stroke width = 2.5 => viewbox = 0.75 0.75 22.5 22.5
  // stroke width = 3 => viewbox = 0.5 0.5 23 23
  // stroke width = 4 => viewbox = 0 0 24 24
  // stroke width = 5 => viewbox = -0.5 -0.5 25 25
  const viewBox = `${2 - sWN / 2} ${2 - sWN / 2} ${20 + sWN} ${20 + sWN}`

  return (
    <StyledSVG viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" size={size} stroke={stroke} {...rest}>
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StyledSVG>
  )
}
