import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { darken } from 'polished'
import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { NetworkContextName } from '../../constants'
import useENSName from '../../hooks/useENSName'
import { useWalletModalToggle } from '../../state/application/hooks'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/reducer'
import { useActiveWeb3React } from '../../hooks'
import { ConnectWallet } from './ConnectWallet'
import WalletModal from '../WalletModal'
import { AccountStatus } from './AccountStatus'
import { ButtonSecondary } from '../Button'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  :focus {
    outline: none;
  }
`
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.red1};
  border: 1px solid ${({ theme }) => theme.red1};
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  transition: background-color 0.3s ease;

  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const Text = styled.p<{ fontSize?: number }>`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 12px;
  width: fit-content;
  font-weight: 500;
  ${({ fontSize }) => (fontSize ? `font-size:${fontSize}px` : '')};
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

export enum ModalView {
  Pending,
  Account
}

export enum DropdownView {
  NetworkOptions,
  WalletOptions,
  Arbitrum,
}

export default function Web3Status() {
  const { active, activate, account, error } = useWeb3React()
  const { chainId: networkConnectorChainId } = useActiveWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)
  const confirmed = sortedRecentTransactions.filter(tx => tx.receipt).map(tx => tx.hash)

  const toggleWalletModal = useWalletModalToggle()
  const [modal, setModal] = useState<ModalView | null>(null);

  const [pendingError, setPendingError] = useState<boolean>()
  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()
  
  const [dropdown, setDropdown] = useState<DropdownView | null>(null);
  
  const tryActivation = async (connector: AbstractConnector | undefined) => {
    setPendingWallet(connector)
    setModal(ModalView.Pending)
    setDropdown(null)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector && connector.walletConnectProvider?.wc?.uri) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch(error => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector)
        } else {
          setPendingError(true)
        }
      })
  }
  
  if (!contextNetwork.active && !active) {
    return null
  }

  return (
    <>
      {error && (
        <Web3StatusError onClick={toggleWalletModal}>
          <Text>{error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}</Text>
        </Web3StatusError>
      )}
      {(networkConnectorChainId && !account) && (
        <ConnectWallet
          setModal={setModal}
          tryActivation={tryActivation}
          dropdown={dropdown}
          setDropdown={setDropdown}
        />
      )}
      {(networkConnectorChainId && !!account) && (
        <AccountStatus
          pendingTransactions={pending}
          ENSName={ENSName ?? undefined}
          account={account}
          networkConnectorChainId={networkConnectorChainId}
          onAddressClick={() => setModal(ModalView.Account)}
        />
      )}
      <WalletModal
        modal={modal}
        setModal={setModal}
        ENSName={ENSName ?? undefined}
        pendingTransactions={pending}
        confirmedTransactions={confirmed}
        setPendingError={setPendingError}
        pendingWallet={pendingWallet}
        pendingError={pendingError}
        tryActivation={tryActivation}
      />
    </>
  )
}
