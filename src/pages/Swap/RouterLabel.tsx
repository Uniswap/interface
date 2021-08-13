import { HideSmall, TYPE } from '../../theme'
import styled, { keyframes } from 'styled-components/macro'
import { AutoRow } from '../../components/Row'
import { ReactComponent as RoutingAPIIcon } from '../../assets/svg/routing_api.svg'
import { ReactNode } from 'react'
import { ButtonGray } from 'components/Button'
import { useToggleVersionLink } from 'components/swap/BetterTradeLink'
import { Version } from 'hooks/useToggledVersion'
import { Link } from 'react-router-dom'
import { Trans } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'
import { useUserRoutingAPIEnabled } from 'state/user/hooks'

const pulse = keyframes`
  0% {background-position:10% 100%}
  50%{background-position:91% 100%}
  100%{background-position:10% 100%}
`

const GradientText = styled(TYPE.black)<{ pulsing: boolean }>`
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

interface RouterLabelProps {
  label?: ReactNode
  version: Version
  pulsing?: boolean
}

export default function AutoRouterLabel({ label, version, pulsing = false }: RouterLabelProps) {
  const linkDestination = useToggleVersionLink(version === Version.v3 ? Version.v2 : Version.v3)

  const [routingAPIEnabled] = useUserRoutingAPIEnabled()

  return (
    <AutoRow gap="4px" width="auto" padding=".5rem">
      {routingAPIEnabled && (
        <MouseoverTooltip
          text={
            <TYPE.black>
              <Trans>Some words about the auto router, why it gets good prices</Trans>
            </TYPE.black>
          }
          placement="top-end"
        >
          <StyledAutoRouterIcon />
          <HideSmall>
            <GradientText fontSize={14} pulsing={pulsing}>
              Auto Routing
            </GradientText>
          </HideSmall>
        </MouseoverTooltip>
      )}
      {label ? (
        label
      ) : (
        <ButtonGray
          width="fit-content"
          padding="0.1rem 0.5rem"
          as={Link}
          to={linkDestination}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            height: '24px',
            opacity: 0.8,
            marginLeft: '0.25rem',
          }}
        >
          <TYPE.black fontSize={12}>{version === Version.v3 ? 'V3' : 'V2'}</TYPE.black>
        </ButtonGray>
      )}
    </AutoRow>
  )
}
