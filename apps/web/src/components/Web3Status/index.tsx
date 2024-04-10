import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent, sendAnalyticsEvent } from 'analytics'
import PortfolioDrawer from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import Loader, { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { IconWrapper } from 'components/Identicon/StatusIcon'
import PrefetchBalancesWrapper from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { getConnection } from 'connection'
import { useConnectionReady } from 'connection/eagerlyConnect'
import { getRecentConnectionMeta } from 'connection/meta'
import useENSName from 'hooks/useENSName'
import useLast from 'hooks/useLast'
import { navSearchInputVisibleSize } from 'hooks/useScreenSize'
import { Portal } from 'nft/components/common/Portal'
import { darken } from 'polished'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateRecentConnectionMeta } from 'state/user/reducer'
import styled from 'styled-components'
import { flexRowNoWrap } from 'theme/styles'
import { shortenAddress } from 'utilities/src/addresses'

import { Icons } from 'ui/src'
import { useUnitagByAddressWithoutFlag } from 'uniswap/src/features/unitags/hooksWithoutFlags'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import { RowBetween } from '../Row'

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

function Web3StatusInner() {
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)
  const ignoreWhileSwitchingChain = useCallback(() => !switchingChain, [switchingChain])
  const connectionReady = useConnectionReady()
  const activeWeb3 = useWeb3React()
  const lastWeb3 = useLast(useWeb3React(), ignoreWhileSwitchingChain)
  const { account, connector } = useMemo(() => (activeWeb3.account ? activeWeb3 : lastWeb3), [activeWeb3, lastWeb3])
  const { unitag } = useUnitagByAddressWithoutFlag(account, Boolean(account))
  const { ENSName, loading: ENSLoading } = useENSName(account)
  const connection = getConnection(connector)
  const dispatch = useAppDispatch()

  const [, toggleAccountDrawer] = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    toggleAccountDrawer()
  }, [toggleAccountDrawer])

  const { hasPendingActivity, pendingActivityCount } = usePendingActivity()

  // Display a loading state while initializing the connection, based on the last session's persisted connection.
  // The connection will go through three states:
  // - startup:       connection is not ready
  // - initializing:  account is available, but ENS (if preset on the persisted initialMeta) is still loading
  // - initialized:   account and ENS are available
  // Subsequent connections are always considered initialized, and will not display startup/initializing states.
  const initialConnection = useRef(getRecentConnectionMeta())
  const isConnectionInitializing = Boolean(
    initialConnection.current?.address === account && initialConnection.current?.ENSName && ENSLoading
  )
  const isConnectionInitialized = connectionReady && !isConnectionInitializing
  // Clear the initial connection once initialized so it does not interfere with subsequent connections.
  useEffect(() => {
    if (isConnectionInitialized) {
      initialConnection.current = undefined
    }
  }, [isConnectionInitialized])
  // Persist the connection if it changes, so it can be used to initialize the next session's connection.
  useEffect(() => {
    if (account || ENSName) {
      const { rdns } = connection.getProviderInfo()
      dispatch(
        updateRecentConnectionMeta({ type: connection.type, address: account, ENSName: ENSName ?? undefined, rdns })
      )
    }
  }, [ENSName, account, connection, dispatch])

  if (!isConnectionInitialized) {
    return (
      <Web3StatusConnecting disabled={!isConnectionInitializing} onClick={handleWalletDropdownClick}>
        <IconWrapper size={24}>
          <LoaderV3 size="24px" />
        </IconWrapper>
        <AddressAndChevronContainer $loading={true}>
          <Text>{initialConnection.current?.ENSName ?? shortenAddress(initialConnection.current?.address)}</Text>
        </AddressAndChevronContainer>
      </Web3StatusConnecting>
    )
  }

  if (account) {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.MINI_PORTFOLIO_TOGGLED}
        properties={{ type: 'open' }}
      >
        <Web3StatusConnected
          disabled={Boolean(switchingChain)}
          data-testid="web3-status-connected"
          onClick={handleWalletDropdownClick}
          pending={hasPendingActivity}
        >
          {!hasPendingActivity && (
            <StatusIcon account={account} size={24} connection={connection} showMiniIcons={false} />
          )}
          {hasPendingActivity ? (
            <RowBetween>
              <Text>
                <Trans>{pendingActivityCount} Pending</Trans>
              </Text>{' '}
              <Loader stroke="white" />
            </RowBetween>
          ) : (
            <AddressAndChevronContainer>
              <Text>{unitag?.username ?? ENSName ?? shortenAddress(account)}</Text>
              {unitag?.username && <Icons.Unitag size={18} />}
            </AddressAndChevronContainer>
          )}
        </Web3StatusConnected>
      </TraceEvent>
    )
  } else {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
        element={InterfaceElementName.CONNECT_WALLET_BUTTON}
      >
        <Web3StatusConnectWrapper
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleWalletDropdownClick()}
          onClick={handleWalletDropdownClick}
        >
          <StyledConnectButton tabIndex={-1} data-testid="navbar-connect-wallet">
            <Trans>Connect</Trans>
          </StyledConnectButton>
        </Web3StatusConnectWrapper>
      </TraceEvent>
    )
  }
}

export default function Web3Status() {
  const [isDrawerOpen] = useAccountDrawer()
  return (
    <PrefetchBalancesWrapper shouldFetchOnAccountUpdate={isDrawerOpen}>
      <Web3StatusInner />
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
