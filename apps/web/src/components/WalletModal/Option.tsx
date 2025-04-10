import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import Badge, { BadgeVariant } from 'components/Badge/Badge'
import Loader from 'components/Icons/LoadingSpinner'
import { DetectedBadge } from 'components/WalletModal/shared'
import { CONNECTOR_ICON_OVERRIDE_MAP, useRecentConnectorId } from 'components/Web3Provider/constants'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { useConnect } from 'hooks/useConnect'
import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isIFramed } from 'utils/isIFramed'
import { Connector } from 'wagmi'

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled.button<{ selected: boolean }>`
  align-items: center;
  background-color: unset;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  justify-content: space-between;
  opacity: ${({ disabled, selected }) => (disabled && !selected ? '0.5' : '1')};
  padding: 18px;
  transition: ${({ theme }) => theme.transition.duration.fast};
`

const HeaderText = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.accent1 : ({ theme }) => theme.neutral1)};
  font-size: 16px;
  font-weight: 535;
  padding: 0 8px;
`
const IconWrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  img {
    ${({ theme }) => !theme.darkMode && `border: 1px solid ${theme.surface3}`};
    border-radius: 12px;
  }
  & > img,
  span {
    height: 40px;
    width: 40px;
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const Wrapper = styled.div<{ disabled: boolean }>`
  align-items: stretch;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  width: 100%;

  background-color: ${({ theme }) => theme.surface2};

  &:hover {
    cursor: ${({ disabled }) => !disabled && 'pointer'};
    background-color: ${({ theme, disabled }) => !disabled && theme.surface3};
  }
  &:focus {
    background-color: ${({ theme, disabled }) => !disabled && theme.surface3};
  }
`

const StyledBadge = styled(Badge)`
  border-radius: 4px;
  padding: 1px 4px;
`

export const RecentBadge = () => (
  <StyledBadge variant={BadgeVariant.SOFT}>
    <ThemedText.LabelMicro color="accent1">
      <Trans i18nKey="common.recent" />
    </ThemedText.LabelMicro>
  </StyledBadge>
)

export function Option({ connector, detected }: { connector: Connector; detected?: boolean }) {
  const connection = useConnect()

  const isPendingConnection = connection.isPending && connection.variables?.connector === connector

  const isRecent = connector.id === useRecentConnectorId()
  const icon = CONNECTOR_ICON_OVERRIDE_MAP[connector.id] ?? connector.icon
  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  const isDisabled = Boolean(connection?.isPending && !isIFramed())

  const RightSideDetail = () => {
    if (isPendingConnection) {
      return <Loader />
    }

    if (isRecent) {
      return <RecentBadge />
    }

    if (detected) {
      return <DetectedBadge />
    }

    return null
  }

  return (
    <Wrapper disabled={isDisabled}>
      <Trace
        logPress
        eventOnTrigger={InterfaceEventName.WALLET_SELECTED}
        properties={{ wallet_name: connector.name, wallet_type: walletTypeToAmplitudeWalletType(connector.type) }}
        element={InterfaceElementName.WALLET_TYPE_OPTION}
      >
        <OptionCardClickable
          disabled={isDisabled}
          onClick={() => {
            // This is a hack to ensure the connection runs in playwright
            // TODO(WEB-4173): Look into removing setTimeout connection.connect({ connector })
            if (isPlaywrightEnv()) {
              setTimeout(() => {
                connection.connect({ connector })
              }, 1)
            } else {
              connection.connect({ connector })
            }
          }}
          selected={isPendingConnection}
          data-testid={`wallet-option-${connector.type}`}
        >
          <OptionCardLeft>
            <IconWrapper>
              <img src={icon} alt={connector.name} />
            </IconWrapper>
            <HeaderText>{connector.name}</HeaderText>
          </OptionCardLeft>
          <RightSideDetail />
        </OptionCardClickable>
      </Trace>
    </Wrapper>
  )
}
