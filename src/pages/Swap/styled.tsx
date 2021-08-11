import styled, { keyframes } from 'styled-components/macro'
import { AutoRow } from '../../components/Row'
import { TYPE } from '../../theme'
import { ReactComponent as RoutingAPIIcon } from '../../assets/svg/routing_api.svg'

const pulse = keyframes`
  0% {background-position:10% 100%}
  50%{background-position:91% 100%}
  100%{background-position:10% 100%}
`

const GradientText = styled(TYPE.black)<{ pulsing: boolean }>`
  background: ${({ pulsing }) =>
    `linear-gradient(90deg, #2172e5, ${pulsing ? ' #2172e5,#2172e5, #fff, #54e526, #54e526,' : ''} #54e526)`};
  background-size: ${({ pulsing }) => (pulsing ? '200% 100%' : '100% 100%')};
  background-clip: none;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  animation: ${({ pulsing }) => pulsing && pulse} 0.6s infinite ease-in-out;
`

const StyledAutoRouterIcon = styled(RoutingAPIIcon)`
  height: 16px;
  width: 16px;
  stroke: #2172e5;
`

export default function AutoRouterLabel({ pulsing = false }: { pulsing?: boolean }) {
  return (
    <AutoRow gap="4px" width="auto" padding=".5rem">
      <StyledAutoRouterIcon />
      <GradientText pulsing={pulsing} fontSize={14}>
        Auto Router
      </GradientText>
    </AutoRow>
  )
}
