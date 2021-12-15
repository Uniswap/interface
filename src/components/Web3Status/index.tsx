import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import { AbstractConnector } from '@web3-react/abstract-connector'
import React, { useMemo, useState } from 'react'
import styled from 'styled-components'
import { NetworkContextName } from '../../constants'
import useENSName from '../../hooks/useENSName'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/reducer'
import { useActiveWeb3React } from '../../hooks'
import { ConnectWalletPopover } from './ConnectWalletPopover'
import WalletModal from '../WalletModal'
import { AccountStatus } from './AccountStatus'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import NetworkSwitcherPopover from '../NetworkSwitcherPopover'
import { useNetworkSwitcherPopoverToggle, useWalletSwitcherPopoverToggle } from '../../state/application/hooks'
import { TriangleIcon } from '../Icons'
import { useTranslation } from 'react-i18next'
import Row from '../Row'
import { useIsMobileByMedia } from '../../hooks/useIsMobileByMedia'
import { useENSAvatar } from '../../hooks/useENSAvatar'
import { ApplicationModal } from '../../state/application/actions'

const Web3StatusError = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0 0 10px;
  color: ${({ theme }) => theme.text1};
  text-transform: uppercase;
  font-weight: bold;
  font-size: 10px;
  line-height: 12px;
  letter-spacing: 0.08em;
  background-color: ${({ theme }) => theme.red1};
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 9px;
  `};
`

const SwitchNetworkButton = styled.button`
  display: flex;
  align-items: center;
  height: 29px;
  padding: 8px 14px;
  margin-left: 8px;
  background-color: ${({ theme }) => theme.primary1};
  color: ${({ theme }) => theme.text1};
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 11px;
  line-height: 12px;
  letter-spacing: 0.08em;
  border: none;
  cursor: pointer;
`

const Button = styled.button`
  height: 29px;
  padding: 10.5px 14px;
  margin: 0 0 0 auto;
  background-color: ${({ theme }) => theme.primary1};
  color: ${({ theme }) => theme.text1};
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 12px;
  line-height: 10px;
  letter-spacing: 0.08em;
  border: none;
  outline: none;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: pointer;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

export enum ModalView {
  Pending,
  Account
}

export default function Web3Status() {
  const { active, activate, account, error } = useWeb3React()
  const { chainId: networkConnectorChainId, connector: activeConnector } = useActiveWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const { ENSName } = useENSName(account ?? undefined)
  const { avatar: ensAvatar } = useENSAvatar(ENSName)
  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter(tx => !tx.receipt).map(tx => tx.hash)
  const confirmed = sortedRecentTransactions.filter(tx => tx.receipt).map(tx => tx.hash)

  const [modal, setModal] = useState<ModalView | null>(null)

  const [pendingError, setPendingError] = useState<boolean>()
  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const toggleNetworkSwitcherPopover = useNetworkSwitcherPopoverToggle()

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    setPendingWallet(connector)
    setModal(ModalView.Pending)

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

  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const { t } = useTranslation()
  const mobileByMedia = useIsMobileByMedia()

  if (!contextNetwork.active && !active) {
    return null
  }

  if (error) {
    return (
      <NetworkSwitcherPopover modal={ApplicationModal.NETWORK_SWITCHER}>
        <Web3StatusError>
          {error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error'}
          <SwitchNetworkButton onClick={toggleNetworkSwitcherPopover}>
            Switch network
            <TriangleIcon />
          </SwitchNetworkButton>
        </Web3StatusError>
      </NetworkSwitcherPopover>
    )
  }

  return (
    <>
      <ConnectWalletPopover setModal={setModal} tryActivation={tryActivation}>
        <Row alignItems="center" justifyContent="flex-end">
          {networkConnectorChainId && !account && (
            <Button id="connect-wallet" onClick={toggleWalletSwitcherPopover}>
              {mobileByMedia ? 'Connect' : t('Connect wallet')}
            </Button>
          )}
          <AccountStatus
            pendingTransactions={pending}
            ENSName={ENSName ?? undefined}
            account={account}
            connector={activeConnector}
            networkConnectorChainId={networkConnectorChainId}
            onAddressClick={() => setModal(ModalView.Account)}
            avatar={ensAvatar ?? undefined}
          />
        </Row>
      </ConnectWalletPopover>
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
