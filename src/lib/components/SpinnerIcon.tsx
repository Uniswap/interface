import styled, { Color, keyframes } from 'lib/theme'

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const SpinnerSvg = styled.svg<{ color: Color }>`
  animation: 2s ${rotate} linear infinite;
  height: 1em;
  stroke: ${({ color, theme }) => theme[color]};
  width: 1em;
`

export default function SpinnerIcon({ color = 'active', ...props }: { color?: Color }) {
  return (
    <SpinnerSvg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color={color} {...props}>
      <mask id="mask">
        <rect width="24" height="24" fill="white" />
        <rect width="12" height="12" fill="black" strokeWidth="0" />
      </mask>
      <circle
        id="circle"
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask="url(#mask)"
      />
    </SpinnerSvg>
  )
}
