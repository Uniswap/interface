import { Box } from 'nft/components/Box'
import styled, { keyframes } from 'styled-components'

const dash = keyframes`
  0% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
`
const Circle = styled.circle`
  stroke-dasharray: 1000;
  stroke-dashoffset: 0;
  -webkit-animation: ${dash} linear;
  animation: ${dash} linear;
  animation-duration: 160s;
  stroke: ${({ theme }) => theme.accent1};
`
export const TimedLoader = () => {
  const stroke = 1.5

  return (
    <Box display="flex" position="absolute">
      <svg height="18px" width="18px">
        <Circle
          strokeWidth={`${stroke}`}
          strokeLinecap="round"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: '50% 50%',
          }}
          fill="transparent"
          r="8px"
          cx="9px"
          cy="9px"
        />
      </svg>
    </Box>
  )
}
