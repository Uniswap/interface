import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { IconWrapper } from 'components/Identicon/StatusIcon'
import WalletDropdown from 'components/WalletDropdown'
import { getConnection } from 'connection/utils'
import { Portal } from 'nft/components/common/Portal'
import { useIsNftClaimAvailable } from 'nft/hooks/useIsNftClaimAvailable'
import { getIsValidSwapQuote } from 'pages/Swap'
import { darken } from 'polished'
import { useMemo, useRef } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import { useAppSelector } from 'state/hooks'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { colors } from 'theme/colors'
import { flexRowNoWrap } from 'theme/styles'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import {
  useCloseModal,
  useModalIsOpen,
  useToggleWalletDropdown,
  useToggleWalletModal,
} from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/types'
import { shortenAddress } from '../../utils'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import Loader from '../Loader'
import { RowBetween } from '../Row'
import WalletModal from '../WalletModal'

// https://stackoverflow.com/a/31617326
const FULL_BORDER_RADIUS = 9999

const ChevronWrapper = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  padding: 10px 16px 10px 4px;

  :hover {
    color: ${({ theme }) => theme.accentActionSoft};
  }
  :hover,
  :active,
  :focus {
    border: none;
  }
`

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
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.deprecated_red1};
  border: 1px solid ${({ theme }) => theme.deprecated_red1};
  color: ${({ theme }) => theme.deprecated_white};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.deprecated_red1)};
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

  :hover,
  :active,
  :focus {
    border: none;
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{
  pending?: boolean
  isClaimAvailable?: boolean
}>`
  background-color: ${({ pending, theme }) => (pending ? theme.deprecated_primary1 : theme.deprecated_bg1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.deprecated_primary1 : theme.deprecated_bg1)};
  color: ${({ pending, theme }) => (pending ? theme.deprecated_white : theme.deprecated_text1)};
  font-weight: 500;
  border: ${({ isClaimAvailable }) => isClaimAvailable && `1px solid ${colors.purple300}`};
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_bg3)};

    :focus {
      border: 1px solid
        ${({ pending, theme }) =>
          pending ? darken(0.1, theme.deprecated_primary1) : darken(0.1, theme.deprecated_bg2)};
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

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
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

const NetworkIcon = styled(AlertTriangle)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

const VerticalDivider = styled.div`
  height: 20px;
  margin: 0px;
  width: 1px;
  background-color: ${({ theme }) => theme.accentAction};
`

const StyledConnectButton = styled.button`
  background-color: transparent;
  border: none;
  border-top-left-radius: ${FULL_BORDER_RADIUS}px;
  border-bottom-left-radius: ${FULL_BORDER_RADIUS}px;
  color: ${({ theme }) => theme.accentAction};
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  padding: 10px 8px 10px 12px;

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `${duration.fast} color ${timing.in}`};

  :hover,
  :active,
  :focus {
    border: none;
  }
  :hover {
    color: ${({ theme }) => theme.accentActionSoft};
  }
`

const CHEVRON_PROPS = {
  height: 20,
  width: 20,
}

function Web3StatusInner() {
  const { account, connector, chainId, ENSName } = useWeb3React()
  const connectionType = getConnection(connector).type
  const {
    trade: { state: tradeState, trade },
    inputError: swapInputError,
  } = useDerivedSwapInfo()
  const validSwapQuote = getIsValidSwapQuote(trade, tradeState, swapInputError)
  const theme = useTheme()
  const toggleWalletDropdown = useToggleWalletDropdown()
  const toggleWalletModal = useToggleWalletModal()
  const walletIsOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)
  const isClaimAvailable = useIsNftClaimAvailable((state) => state.isClaimAvailable)

  const error = useAppSelector((state) => state.connection.errorByConnectionType[getConnection(connector).type])

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length
  const toggleWallet = toggleWalletDropdown

  if (!chainId) {
    return null
  } else if (error) {
    return (
      <Web3StatusError onClick={toggleWallet}>
        <NetworkIcon />
        <Text>
          <Trans>Error</Trans>
        </Text>
      </Web3StatusError>
    )
  } else if (account) {
    const chevronProps = {
      ...CHEVRON_PROPS,
      color: theme.textSecondary,
    }

    return (
      <Web3StatusConnected
        data-testid="web3-status-connected"
        onClick={toggleWallet}
        pending={hasPendingTransactions}
        isClaimAvailable={isClaimAvailable}
      >
        {!hasPendingTransactions && <StatusIcon size={24} connectionType={connectionType} />}
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
            {walletIsOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
          </AddressAndChevronContainer>
        )}
      </Web3StatusConnected>
    )
  } else {
    const chevronProps = {
      ...CHEVRON_PROPS,
      color: theme.accentAction,
      'data-testid': 'navbar-wallet-dropdown',
    }
    return (
      <TraceEvent
        events={[BrowserEvent.onClick]}
        name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: validSwapQuote }}
        element={ElementName.CONNECT_WALLET_BUTTON}
      >
        <Web3StatusConnectWrapper faded={!account}>
          <StyledConnectButton data-testid="navbar-connect-wallet" onClick={toggleWalletModal}>
            <Trans>Connect</Trans>
          </StyledConnectButton>
          <VerticalDivider />
          <ChevronWrapper onClick={toggleWalletDropdown}>
            {walletIsOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
          </ChevronWrapper>
        </Web3StatusConnectWrapper>
      </TraceEvent>
    )
  }
}

export default function Web3Status() {
  const { ENSName } = useWeb3React()

  const allTransactions = useAllTransactions()
  const ref = useRef<HTMLDivElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)
  const closeModal = useCloseModal(ApplicationModal.WALLET_DROPDOWN)
  const isOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)

  useOnClickOutside(ref, isOpen ? closeModal : undefined, [walletRef])

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)
  const confirmed = sortedRecentTransactions.filter((tx) => tx.receipt).map((tx) => tx.hash)

  return (
    <span ref={ref}>
      <Web3StatusInner />
      <WalletModal ENSName={ENSName ?? undefined} pendingTransactions={pending} confirmedTransactions={confirmed} />
      <Portal>
        <span ref={walletRef}>
          <WalletDropdown />
        </span>
      </Portal>
    </span>
  )
}
