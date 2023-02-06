import { Trans, t } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { darken, lighten } from 'polished'
import { useMemo } from 'react'
import { Activity } from 'react-feather'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ButtonLight } from 'components/Button'
import WalletModal from 'components/Header/web3/WalletModal'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import { TutorialIds } from 'components/Tutorial/TutorialSwap/constant'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENSName from 'hooks/useENSName'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useNetworkModalToggle, useWalletModalToggle } from 'state/application/hooks'
import { isTransactionRecent, newTransactionsFirst, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/type'
import { useIsDarkMode } from 'state/user/hooks'
import { shortenAddress } from 'utils'

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`

const Web3StatusGeneric = styled.button`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
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
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  border: 1px solid ${({ pending, theme }) => (pending ? theme.primary : theme.buttonGray)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.subText)};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ pending, theme }) =>
      pending ? darken(0.05, theme.primary) : lighten(0.05, theme.buttonGray)};
    border: 1px solid ${({ theme }) => theme.primary};
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.25rem 0 0.5rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

const AccountElement = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 999px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  pointer-events: auto;
  height: 42px;
`

function Web3StatusInner() {
  const { chainId, account, walletKey, isEVM } = useActiveWeb3React()
  const { error } = useWeb3React()
  const isDarkMode = useIsDarkMode()
  const { mixpanelHandler } = useMixpanel()

  const { ENSName } = useENSName(isEVM ? account ?? undefined : undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs: TransactionDetails[] = allTransactions
      ? (Object.values(allTransactions)?.flat().filter(Boolean) as TransactionDetails[])
      : []
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pendingLength = sortedRecentTransactions.filter(tx => !tx.receipt).length

  const hasPendingTransactions = !!pendingLength
  const toggleWalletModal = useWalletModalToggle()
  const toggleNetworkModal = useNetworkModalToggle()

  const above369 = useMedia('(min-width: 369px)')
  if (account) {
    return (
      <Web3StatusConnected
        id={TutorialIds.BUTTON_ADDRESS_WALLET}
        onClick={() => {
          toggleWalletModal()
          mixpanelHandler(MIXPANEL_TYPE.WUI_WALLET_CLICK)
        }}
        pending={hasPendingTransactions}
      >
        {hasPendingTransactions ? (
          <RowBetween>
            <Text>
              <Trans>{pendingLength} Pending</Trans>
            </Text>{' '}
            <Loader stroke="white" />
          </RowBetween>
        ) : (
          <>
            {walletKey && (
              <IconWrapper size={16}>
                <img
                  src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                  alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                />
              </IconWrapper>
            )}
            <Text>{ENSName || shortenAddress(chainId, account, above369 ? undefined : 2)}</Text>
          </>
        )}
      </Web3StatusConnected>
    )
  } else if (error) {
    return (
      <Web3StatusError onClick={toggleNetworkModal}>
        <NetworkIcon />
        <Text>{error instanceof UnsupportedChainIdError ? t`Wrong Network` : t`Error`}</Text>
      </Web3StatusError>
    )
  } else {
    return (
      <ButtonLight onClick={toggleWalletModal} padding="10px 12px" id={TutorialIds.BUTTON_CONNECT_WALLET}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    )
  }
}

export default function SelectWallet() {
  return (
    <AccountElement>
      <Web3StatusInner />
      <WalletModal />
    </AccountElement>
  )
}
