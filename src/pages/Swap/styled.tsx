import styled, { keyframes } from 'styled-components/macro'
import { AutoRow } from '../../components/Row'
import { TYPE } from '../../theme'
import { ReactComponent as RoutingAPIIcon } from '../../assets/svg/routing_api.svg'

const pulse = keyframes`
  0% {background-position:10% 100%}
  50%{background-position:91% 100%}
  100%{background-position:10% 100%}
`

const GradientText = styled(AutoRow)<{ pulsing: boolean }>`
  background: ${({ pulsing }) =>
    `linear-gradient(90deg, #2172e5, ${pulsing ? ' #2172e5,#2172e5, #fff, #54e526, #54e526,' : ''} #54e526)`};

  background-size: ${({ pulsing }) => (pulsing ? '200%' : '100%')};
  background-clip: none;
  background-repeat: repeat;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: ${({ pulsing }) => pulsing && pulse} 0.6s infinite ease-in-out;
  will-change: background-position;
  transform: translateZ(0); /* GPU acceleration */
`

const StyledAutoRouterIcon = styled(RoutingAPIIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

export default function AutoRouterLabel({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <GradientText gap="4px" width="auto" padding=".5rem" pulsing={pulsing}>
      <StyledAutoRouterIcon />
      <TYPE.black fontSize={14}>Auto Routing</TYPE.black>
    </GradientText>
  )
}
