import { Trans } from '@lingui/macro'
import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { FileText, LogOut } from 'react-feather'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Close } from 'assets/images/x.svg'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Wallet from 'components/Icons/Wallet'
import { AutoRow, RowBetween, RowFit } from 'components/Row'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import useENSName from 'hooks/useENSName'
import useTheme from 'hooks/useTheme'
import { AppDispatch } from 'state'
import { clearAllTransactions } from 'state/transactions/actions'
import {
  isTransactionGroupRecent as isTxGroupRecent,
  newTransactionsGroupFirst as newTxGroupFirst,
  useAllTransactions,
} from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/type'
import { useIsDarkMode, useIsUserManuallyDisconnect } from 'state/user/hooks'
import { ButtonText, ExternalLink, LinkStyledButton, TYPE } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'

import Transaction from './Transaction'
import TransactionGroup from './TransactionGroup'

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  font-weight: 500;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }
`

const YourAccount = styled.div`
  padding: 16px 12px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonBlack};
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 8px;
`

const LowerSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 1.5rem;
  flex-grow: 1;
  overflow: auto;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  h5 {
    margin: 0;
    font-weight: 400;
    color: ${({ theme }) => theme.text3};
  }
`

const AccountControl = styled.div`
  display: flex;
  justify-content: space-between;
  min-width: 0;
  width: 100%;

  font-weight: 500;
  font-size: 14px;

  a:hover {
    text-decoration: underline;
  }

  p {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const CloseIcon = styled.div`
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text};
  }
`

const WalletName = styled.div`
  width: initial;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
`

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
`

function renderTxGroups(transactions: TransactionDetails[][]) {
  return (
    <TransactionListWrapper>
      {transactions.map((groupTransactions, i) => {
        if (groupTransactions.length === 1) return <Transaction key={i} transaction={groupTransactions[0]} />
        return <TransactionGroup key={i} transactions={groupTransactions} />
      })}
    </TransactionListWrapper>
  )
}

interface AccountDetailsProps {
  toggleWalletModal: () => void
  openOptions: () => void
}

export default function AccountDetails({ toggleWalletModal, openOptions }: AccountDetailsProps) {
  const { chainId, account, walletKey, isEVM, isSolana } = useActiveWeb3React()
  const { connector, deactivate } = useWeb3React()
  const { disconnect } = useWallet()
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const isDarkMode = useIsDarkMode()
  const { ENSName } = useENSName(isEVM ? account ?? undefined : undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTxGroups: TransactionDetails[][] = useMemo(() => {
    const txGroups: TransactionDetails[][] = allTransactions
      ? (Object.values(allTransactions).filter(Boolean) as TransactionDetails[][])
      : []
    return txGroups.filter(isTxGroupRecent).sort(newTxGroupFirst)
  }, [allTransactions])

  const pendingTxGroups: TransactionDetails[][] = sortedRecentTxGroups.filter(txs => txs.some(txs => !txs.receipt))
  const confirmedTxGroups: TransactionDetails[][] = sortedRecentTxGroups.filter(txs => txs.every(txs => txs.receipt))

  function formatConnectorName(): JSX.Element | null {
    if (!walletKey) {
      console.error('Cannot find the wallet connected')
      return null
    }

    return (
      <WalletName>
        <Trans>Connected with {SUPPORTED_WALLETS[walletKey].name}</Trans>
      </WalletName>
    )
  }

  const clearAllTransactionsCallback = useCallback(() => {
    if (chainId) dispatch(clearAllTransactions({ chainId }))
  }, [dispatch, chainId])

  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()

  const handleDisconnect = () => {
    if (isEVM) {
      deactivate()
      // @ts-expect-error close can be returned by wallet
      if (connector && connector.close) connector.close()
    } else if (isSolana) {
      disconnect()
    }
    setIsUserManuallyDisconnect(true)
  }

  return (
    <>
      <UpperSection>
        <HeaderRow>
          <Trans>Your Account</Trans>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
        </HeaderRow>

        <Flex flexDirection="column" marginTop="8px" paddingX="20px">
          <RowBetween>
            <Text>{formatConnectorName()}</Text>
            <ButtonText onClick={handleDisconnect}>
              <RowFit color={theme.subText} gap="4px">
                <LogOut size={16} />{' '}
                <Text fontSize={14}>
                  <Trans>Disconnect</Trans>
                </Text>
              </RowFit>
            </ButtonText>
          </RowBetween>
          <YourAccount>
            <AccountGroupingRow id="web3-account-identifier-row">
              <AccountControl>
                <div>
                  {walletKey && (
                    <IconWrapper size={16}>
                      <img
                        src={isDarkMode ? SUPPORTED_WALLETS[walletKey].icon : SUPPORTED_WALLETS[walletKey].iconLight}
                        alt={SUPPORTED_WALLETS[walletKey].name + ' icon'}
                      />
                    </IconWrapper>
                  )}

                  <p> {ENSName || (isMobile && account ? shortenAddress(chainId, account, 10) : account)}</p>
                </div>
              </AccountControl>
            </AccountGroupingRow>

            <CopyHelper toCopy={account || ''} />
          </YourAccount>
        </Flex>

        <Flex justifyContent="space-between" marginTop="24px" paddingX="20px">
          <ExternalLink href={getEtherscanLink(chainId, ENSName || account || '', 'address')}>
            <Flex alignItems="center">
              <FileText size={16} />
              <Text marginLeft="4px" fontSize="14px">
                <Trans>View Transactions</Trans> ↗
              </Text>
            </Flex>
          </ExternalLink>

          {isEVM && (
            <ExternalLink href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}>
              <Flex alignItems="center">
                <Wallet size={16} />
                <Text fontSize="14px" marginLeft="4px">
                  <Trans>Analyze Wallet</Trans> ↗
                </Text>
              </Flex>
            </ExternalLink>
          )}
        </Flex>
      </UpperSection>

      <Flex marginTop="24px" paddingX="20px" width="100%">
        <Divider style={{ width: '100%' }} />
      </Flex>
      {!!pendingTxGroups.length || !!confirmedTxGroups.length ? (
        <LowerSection>
          <AutoRow mb={'1rem'} style={{ justifyContent: 'space-between' }}>
            <TYPE.body>
              <Trans>Recent Transactions</Trans>
            </TYPE.body>
            <LinkStyledButton onClick={clearAllTransactionsCallback}>(clear all)</LinkStyledButton>
          </AutoRow>
          {renderTxGroups(pendingTxGroups.slice(0, 5))}
          {renderTxGroups(confirmedTxGroups.slice(0, 5))}
        </LowerSection>
      ) : (
        <LowerSection>
          <TYPE.body color={theme.text}>
            <Trans>Your transactions will appear here...</Trans>
          </TYPE.body>
        </LowerSection>
      )}
    </>
  )
}
