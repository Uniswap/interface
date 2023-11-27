import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import Loader from 'components/Icons/LoadingSpinner'
import { injectedConnection } from 'connection'
import { ActivationStatus, useActivationState } from 'connection/activate'
import { Connection } from 'connection/types'
import styled from 'styled-components'
import { ButtonText, ThemedText } from 'theme/components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

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

const ICON_OVERRIDE_MAP: { [rdns in string]?: string } = {
  'io.metamask': METAMASK_ICON, // MetaMask's provided icon has no padding
}

/** Returns a different icon than the input if we want to override the one provided by a wallet */
function getOverrideIcon(icon: string | undefined, rdns?: string) {
  if (!rdns) return icon
  return ICON_OVERRIDE_MAP[rdns] ?? icon
}

interface OptionProps {
  connection: Connection
}
export default function Option({ connection }: OptionProps) {
  const { activationState, tryActivation } = useActivationState()
  const toggleAccountDrawer = useToggleAccountDrawer()
  const { chainId } = useWeb3React()

  const isDarkMode = useIsDarkMode()
  const { name, icon, rdns } = connection.getProviderInfo(isDarkMode)
  const displayIcon = getOverrideIcon(icon, rdns)

  const isSomeOptionPending = activationState.status === ActivationStatus.PENDING
  const isCurrentOptionPending = isSomeOptionPending && activationState.connection === connection

  return (
    <Wrapper disabled={isSomeOptionPending}>
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.WALLET_SELECTED}
        properties={{ wallet_type: name }}
        element={InterfaceElementName.WALLET_TYPE_OPTION}
      >
        <OptionCardClickable
          disabled={isSomeOptionPending}
          onClick={() => tryActivation(connection, toggleAccountDrawer, chainId)}
          selected={isCurrentOptionPending}
          data-testid={`wallet-option-${connection.type}`}
        >
          <OptionCardLeft>
            <IconWrapper>
              <img src={displayIcon} alt={name} />
            </IconWrapper>
            <HeaderText>{name}</HeaderText>
          </OptionCardLeft>
          {isCurrentOptionPending && <Loader />}
        </OptionCardClickable>
      </TraceEvent>
    </Wrapper>
  )
}

export function DeprecatedInjectorMessage() {
  const { tryActivation } = useActivationState()
  const toggleAccountDrawer = useToggleAccountDrawer()
  const { chainId } = useWeb3React()

  return (
    <ButtonText onClick={() => tryActivation(injectedConnection, toggleAccountDrawer, chainId)}>
      <ThemedText.BodySmall color="neutral2">
        <Trans>Don&apos;t see your wallet?</Trans>
      </ThemedText.BodySmall>
    </ButtonText>
  )
}
