import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, TraceEvent } from 'analytics'
import PortfolioDrawer, { useAccountDrawer } from 'components/AccountDrawer'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import Loader from 'components/Icons/LoadingSpinner'
import { IconWrapper } from 'components/Identicon/StatusIcon'
import PrefetchBalancesWrapper from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { getConnection } from 'connection'
import useENSName from 'hooks/useENSName'
import useLast from 'hooks/useLast'
import { navSearchInputVisibleSize } from 'hooks/useScreenSize'
import { Portal } from 'nft/components/common/Portal'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { darken } from 'polished'
import { useCallback } from 'react'
import { useAppSelector } from 'state/hooks'
import styled from 'styled-components'
import { colors } from 'theme/colors'
import { flexRowNoWrap } from 'theme/styles'
import { shortenAddress } from 'utils'

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
  isClaimAvailable?: boolean
}>`
  background-color: ${({ pending, theme }) => (pending ? theme.accent1 : theme.surface1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.accent1 : theme.surface1)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.neutral1)};
  border: ${({ isClaimAvailable }) => isClaimAvailable && `1px solid ${colors.purple300}`};
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

const AddressAndChevronContainer = styled.div`
  display: flex;

  @media only screen and (max-width: ${navSearchInputVisibleSize}px) {
    display: none;
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.25rem 0 0.25rem;
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
  const { account, connector } = useLast(useWeb3React(), ignoreWhileSwitchingChain)
  const { ENSName } = useENSName(account)
  const connection = getConnection(connector)

  const [, toggleAccountDrawer] = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    toggleAccountDrawer()
  }, [toggleAccountDrawer])
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const { hasPendingActivity, pendingActivityCount } = usePendingActivity()

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
          isClaimAvailable={isClaimAvailable}
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
              <Text>{ENSName || shortenAddress(account)}</Text>
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
