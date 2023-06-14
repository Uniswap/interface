import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import PortfolioDrawer, { useAccountDrawer } from 'components/AccountDrawer'
import PrefetchBalancesWrapper from 'components/AccountDrawer/PrefetchBalancesWrapper'
import Loader from 'components/Icons/LoadingSpinner'
import { IconWrapper } from 'components/Identicon/StatusIcon'
import { getConnection } from 'connection'
import { navSearchInputVisibleSize } from 'hooks/useScreenSize'
import { Portal } from 'nft/components/common/Portal'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { darken } from 'polished'
import { useCallback, useMemo } from 'react'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'
import { flexRowNoWrap } from 'theme/styles'

import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/types'
import { shortenAddress } from '../../utils'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import { RowBetween } from '../Row'

// https://stackoverflow.com/a/31617326
const FULL_BORDER_RADIUS = 9999

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${flexRowNoWrap};
  width: 100%;
  align-items: center;
  padding: 0.5rem;
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

const Web3StatusConnectWrapper = styled.div<{ faded?: boolean }>`
  ${flexRowNoWrap};
  align-items: center;
  background-color: ${({ theme }) => theme.accentActionSoft};
  border-radius: ${FULL_BORDER_RADIUS}px;
  border: none;
  padding: 0;
  height: 40px;

  color: ${({ theme }) => theme.accentAction};
  :hover {
    color: ${({ theme }) => theme.accentActionSoft};
    stroke: ${({ theme }) => theme.accentActionSoft};
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
  background-color: ${({ pending, theme }) => (pending ? theme.accentAction : theme.deprecated_bg1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.accentAction : theme.deprecated_bg1)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.textPrimary)};
  font-weight: 500;
  border: ${({ isClaimAvailable }) => isClaimAvailable && `1px solid ${colors.purple300}`};
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_bg3)};

    :focus {
      border: 1px solid
        ${({ pending, theme }) =>
          pending ? darken(0.1, theme.accentAction) : darken(0.1, theme.backgroundInteractive)};
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
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

const StyledConnectButton = styled.button`
  background-color: transparent;
  border: none;
  border-top-left-radius: ${FULL_BORDER_RADIUS}px;
  border-bottom-left-radius: ${FULL_BORDER_RADIUS}px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  padding: 10px 12px;
  color: inherit;
`

function Web3StatusInner() {
  const { account, connector, chainId, ENSName } = useWeb3React()
  const connection = getConnection(connector)
  const [, toggleAccountDrawer] = useAccountDrawer()
  const handleWalletDropdownClick = useCallback(() => {
    sendAnalyticsEvent(InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED)
    toggleAccountDrawer()
  }, [toggleAccountDrawer])
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length

  if (!chainId) {
    return null
  } else if (account) {
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={InterfaceEventName.MINI_PORTFOLIO_TOGGLED}
        properties={{ type: 'open' }}
      >
        <Web3StatusConnected
          data-testid="web3-status-connected"
          onClick={handleWalletDropdownClick}
          pending={hasPendingTransactions}
          isClaimAvailable={isClaimAvailable}
        >
          {!hasPendingTransactions && <StatusIcon size={24} connection={connection} showMiniIcons={false} />}
          {hasPendingTransactions ? (
            <RowBetween>
              <Text>
                <Trans>{pending?.length} Pending</Trans>
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
          faded={!account}
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
  return (
    <PrefetchBalancesWrapper>
      <Web3StatusInner />
      <Portal>
        <PortfolioDrawer />
      </Portal>
    </PrefetchBalancesWrapper>
  )
}
