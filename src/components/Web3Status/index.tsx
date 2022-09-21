// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'analytics/constants'
import { TraceEvent } from 'analytics/TraceEvent'
import WalletDropdown from 'components/WalletDropdown'
import { getConnection } from 'connection/utils'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { Portal } from 'nft/components/common/Portal'
import { getIsValidSwapQuote } from 'pages/Swap'
import { darken } from 'polished'
import { useMemo, useRef } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import { useAppSelector } from 'state/hooks'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import styled, { css, useTheme } from 'styled-components/macro'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { useHasSocks } from '../../hooks/useSocksBalance'
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

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
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

const Web3StatusConnectButton = styled.button<{ faded?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  background-color: ${({ theme }) => theme.accentActionSoft};
  border-radius: ${FULL_BORDER_RADIUS}px;
  border: none;
  cursor: pointer;
  padding: 0 12px;
  height: 40px;

  :hover,
  :active,
  :focus {
    border: none;
  }
`

const Web3StatusConnect = styled(Web3StatusGeneric)<{ faded?: boolean }>`
  background-color: ${({ theme }) => theme.deprecated_primary4};
  border: none;
  color: ${({ theme }) => theme.deprecated_primaryText1};
  font-weight: 500;

  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_primary4)};
    color: ${({ theme }) => theme.deprecated_primaryText1};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: ${({ theme }) => theme.deprecated_primary5};
      border: 1px solid ${({ theme }) => theme.deprecated_primary5};
      color: ${({ theme }) => theme.deprecated_primaryText1};

      :hover,
      :focus {
        border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_primary4)};
        color: ${({ theme }) => darken(0.05, theme.deprecated_primaryText1)};
      }
    `}
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.deprecated_primary1 : theme.deprecated_bg1)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.deprecated_primary1 : theme.deprecated_bg1)};
  color: ${({ pending, theme }) => (pending ? theme.deprecated_white : theme.deprecated_text1)};
  font-weight: 500;
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.deprecated_bg3)};

    :focus {
      border: 1px solid
        ${({ pending, theme }) =>
          pending ? darken(0.1, theme.deprecated_primary1) : darken(0.1, theme.deprecated_bg2)};
    }
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

function Sock() {
  return (
    <span role="img" aria-label={t`has socks emoji`} style={{ marginTop: -4, marginBottom: -4 }}>
      🧦
    </span>
  )
}

const VerticalDivider = styled.div`
  height: 20px;
  margin: 0px 4px;
  width: 1px;
  background-color: ${({ theme }) => theme.accentAction};
`

const StyledConnect = styled.div`
  color: ${({ theme }) => theme.accentAction};
  font-weight: 600;
  font-size: 16px;
  margin-right: 8px;

  &:hover {
    color: ${({ theme }) => theme.accentActionSoft};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} color ${timing.in}`};
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
  const navbarFlagEnabled = useNavBarFlag() === NavBarVariant.Enabled
  const theme = useTheme()
  const toggleWalletDropdown = useToggleWalletDropdown()
  const toggleWalletModal = useToggleWalletModal()
  const walletIsOpen = useIsOpen()

  const error = useAppSelector((state) => state.connection.errorByConnectionType[getConnection(connector).type])

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length
  const hasSocks = useHasSocks()
  const toggleWallet = navbarFlagEnabled ? toggleWalletDropdown : toggleWalletModal

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
      <Web3StatusConnected data-testid="web3-status-connected" onClick={toggleWallet} pending={hasPendingTransactions}>
        {navbarFlagEnabled && !hasPendingTransactions && <StatusIcon size={24} connectionType={connectionType} />}
        {hasPendingTransactions ? (
          <RowBetween>
            <Text>
              <Trans>{pending?.length} Pending</Trans>
            </Text>{' '}
            <Loader stroke="white" />
          </RowBetween>
        ) : (
          <>
            {hasSocks && !navbarFlagEnabled ? <Sock /> : null}
            <Text>{ENSName || shortenAddress(account)}</Text>
            {navbarFlagEnabled ? (
              walletIsOpen ? (
                <ChevronUp {...chevronProps} />
              ) : (
                <ChevronDown {...chevronProps} />
              )
            ) : null}
          </>
        )}
        {!navbarFlagEnabled && !hasPendingTransactions && <StatusIcon connectionType={connectionType} />}
      </Web3StatusConnected>
    )
  } else {
    const chevronProps = {
      ...CHEVRON_PROPS,
      color: theme.accentAction,
      'data-testid': 'navbar-wallet-dropdown',
      onClick: toggleWalletDropdown,
    }
    return (
      <TraceEvent
        events={[Event.onClick]}
        name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
        properties={{ received_swap_quote: validSwapQuote }}
        element={ElementName.CONNECT_WALLET_BUTTON}
      >
        {navbarFlagEnabled ? (
          <Web3StatusConnectButton faded={!account}>
            <StyledConnect data-testid="navbar-connect-wallet" onClick={toggleWalletModal}>
              <Trans>Connect</Trans>
            </StyledConnect>
            <VerticalDivider />
            {walletIsOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
          </Web3StatusConnectButton>
        ) : (
          <Web3StatusConnect onClick={toggleWallet} faded={!account}>
            <Text>
              <Trans>Connect Wallet</Trans>
            </Text>
          </Web3StatusConnect>
        )}
      </TraceEvent>
    )
  }
}

const useIsOpen = () => {
  const walletDropdownOpen = useModalIsOpen(ApplicationModal.WALLET_DROPDOWN)
  const navbarFlag = useNavBarFlag()

  return useMemo(() => navbarFlag === NavBarVariant.Enabled && walletDropdownOpen, [navbarFlag, walletDropdownOpen])
}

export default function Web3Status() {
  const { ENSName } = useWeb3React()

  const allTransactions = useAllTransactions()
  const ref = useRef<HTMLDivElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)
  const closeModal = useCloseModal(ApplicationModal.WALLET_DROPDOWN)
  const isOpen = useIsOpen()

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
