import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import PortfolioDrawer from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonSecondary } from 'components/Button'
import Loader, { LoaderV3 } from 'components/Icons/LoadingSpinner'
import StatusIcon, { IconWrapper } from 'components/Identicon/StatusIcon'
import { RowBetween } from 'components/Row'
import { useAccountIdentifier } from 'components/Web3Status/useAccountIdentifier'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/TokenBalancesProvider'
import { navSearchInputVisibleSize } from 'hooks/screenSize/useScreenSize'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import { atom, useAtom } from 'jotai'
import styled from 'lib/styled-components'
import { Portal } from 'nft/components/common/Portal'
import { darken } from 'polished'
import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useAppSelector } from 'state/hooks'
import { flexRowNoWrap } from 'theme/styles'
import { Unitag } from 'ui/src/components/icons'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isIFramed } from 'utils/isIFramed'

// https://stackoverflow.com/a/31617326
const FULL_BORDER_RADIUS = 9999

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${flexRowNoWrap};
  width: 100%;
  align-items: center;
  padding: 0.5rem 0.25rem;
  border-radius: ${FULL_BORDER_RADIUS}px;
  cursor: pointer;
  user-select: none;
  height: 36px;
  margin-right: 2px;
  margin-left: 2px;
  :focus {
    outline: none;
  }
`

const Web3StatusConnectWrapper = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  background-color: ${({ theme }) => theme.accent2};
  border-radius: ${FULL_BORDER_RADIUS}px;
  border: none;
  padding: 0;
  height: 40px;

  color: ${({ theme }) => theme.accent1};
  :hover {
    color: ${({ theme }) => theme.accent1};
    stroke: ${({ theme }) => theme.accent2};
    background-color: ${({ theme }) => darken(0.015, theme.accent2)};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.fast} color ${timing.in}`};
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{
  pending?: boolean
}>`
  background-color: ${({ pending, theme }) => (pending ? theme.accent1 : theme.surface1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.accent1 : theme.surface1)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.neutral1)};
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => theme.surface2};
    background-color: ${({ pending, theme }) => (pending ? theme.accent2 : theme.surface2)};

    :focus {
      border: 1px solid ${({ pending, theme }) => (pending ? darken(0.1, theme.accent1) : darken(0.1, theme.surface3))};
    }
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    width: ${({ pending }) => !pending && '36px'};

    ${IconWrapper} {
      margin-right: 0;
    }
  }
`

const Web3StatusConnecting = styled(Web3StatusConnected)`
  &:disabled {
    opacity: 1;
  }
`

const AddressAndChevronContainer = styled.div<{ $loading?: boolean }>`
  display: flex;
  opacity: ${({ $loading, theme }) => $loading && theme.opacity.disabled};
  align-items: center;

  @media only screen and (max-width: ${navSearchInputVisibleSize}px) {
    display: none;
  }
`

const Text = styled.span`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 2px;
  font-size: 1rem;
  width: fit-content;
  font-weight: 485;
`

const StyledConnectButton = styled.button`
  background-color: transparent;
  border: none;
  border-top-left-radius: ${FULL_BORDER_RADIUS}px;
  border-bottom-left-radius: ${FULL_BORDER_RADIUS}px;
  cursor: pointer;
  font-weight: 535;
  font-size: 16px;
  padding: 10px 12px;
  color: inherit;
`

export const Web3StatusRef = atom<RefObject<HTMLElement> | undefined>(undefined)

function Web3StatusInner() {
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  const account = useAccount()
  const ref = useRef<HTMLDivElement>(null)
  const [, setRef] = useAtom(Web3StatusRef)

  // To share the Connect button ref with the AccountDrawer modal so it doesn't trigger useOnClickOutside
  useEffect(() => {
    setRef(ref)
  }, [setRef])

  const accountDrawer = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    accountDrawer.open()
  }, [accountDrawer])

  const { hasPendingActivity, pendingActivityCount } = usePendingActivity()
  const { accountIdentifier, hasUnitag, hasRecent } = useAccountIdentifier()

  // TODO(WEB-4173): Remove isIFrame check when we can update wagmi to version >= 2.9.4
  if ((account.isConnecting || account.isReconnecting) && hasRecent && !isIFramed()) {
    return (
      <Web3StatusConnecting disabled={true} onClick={handleWalletDropdownClick} ref={ref}>
        <IconWrapper size={24}>
          <LoaderV3 size="24px" />
        </IconWrapper>
        <AddressAndChevronContainer $loading={true}>
          <Text>{accountIdentifier}</Text>
          {hasUnitag && <Unitag size={18} />}
        </AddressAndChevronContainer>
      </Web3StatusConnecting>
    )
  }

  if (account.address) {
    return (
      <Trace logPress eventOnTrigger={InterfaceEventName.MINI_PORTFOLIO_TOGGLED} properties={{ type: 'open' }}>
        <Web3StatusConnected
          disabled={Boolean(switchingChain)}
          data-testid="web3-status-connected"
          onClick={handleWalletDropdownClick}
          pending={hasPendingActivity}
          ref={ref}
        >
          {!hasPendingActivity && <StatusIcon size={24} showMiniIcons={false} />}
          {hasPendingActivity ? (
            <RowBetween>
              <Text>
                <Trans i18nKey="activity.pending" values={{ pendingActivityCount }} />
              </Text>{' '}
              <Loader stroke="white" />
            </RowBetween>
          ) : (
            <AddressAndChevronContainer>
              <Text>{accountIdentifier}</Text>
              {hasUnitag && <Unitag size={18} />}
            </AddressAndChevronContainer>
          )}
        </Web3StatusConnected>
      </Trace>
    )
  } else {
    return (
      <Trace
        logPress
        eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <Web3StatusConnectWrapper
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleWalletDropdownClick()}
          onClick={handleWalletDropdownClick}
          ref={ref}
        >
          <StyledConnectButton tabIndex={-1} data-testid="navbar-connect-wallet">
            <Trans i18nKey="common.connect.button" />
          </StyledConnectButton>
        </Web3StatusConnectWrapper>
      </Trace>
    )
  }
}

export default function Web3Status() {
  return (
    <PrefetchBalancesWrapper>
      <Web3StatusInner />
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
