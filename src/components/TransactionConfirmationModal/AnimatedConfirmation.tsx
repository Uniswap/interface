import styled, { keyframes, useTheme } from 'styled-components'

const Wrapper = styled.div<{ size?: string }>`
  height: 90px;
  width: 90px;
`

const dash = keyframes`
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
`

const dashCheck = keyframes`
  0% {
    stroke-dashoffset: -100;
  }
  100% {
    stroke-dashoffset: 900;
  }
`

const Circle = styled.circle`
  stroke-dasharray: 1000;
  stroke-dashoffset: 0;
  -webkit-animation: ${dash} 0.9s ease-in-out;
  animation: ${dash} 0.9s ease-in-out;
`

const PolyLine = styled.polyline`
  stroke-dasharray: 1000;
  stroke-dashoffset: 0;
  stroke-dashoffset: -100;
  -webkit-animation: ${dashCheck} 0.9s 0.35s ease-in-out forwards;
  animation: ${dashCheck} 0.9s 0.35s ease-in-out forwards;
`

export default function AnimatedConfirmation({ className }: { className?: string }) {
  const theme = useTheme()

  return (
    <Wrapper className={className} data-testid="animated-confirmation">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130.2 130.2">
        <Circle
          className="path circle"
          fill="none"
          stroke={theme.success}
          strokeWidth="6"
          strokeMiterlimit="10"
          cx="65.1"
          cy="65.1"
          r="62.1"
        />
        <PolyLine
          className="path check"
          fill="none"
          stroke={theme.success}
          strokeWidth="6"
          strokeLinecap="round"
          strokeMiterlimit="10"
          points="100.2,40.2 51.5,88.8 29.8,67.5 "
        />
      </svg>
    </Wrapper>
  )
}
