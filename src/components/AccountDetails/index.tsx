import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import React, { useCallback } from 'react'
import { isMobile } from 'react-device-detect'
import { FileText } from 'react-feather'
import { useDispatch } from 'react-redux'
import { useLocalStorage } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Wallet from 'components/Icons/Wallet'
import { PROMM_ANALYTICS_URL, SUPPORTED_WALLETS } from 'constants/index'
import useTheme from 'hooks/useTheme'

import CoinbaseWalletIcon from '../../assets/images/coinbaseWalletIcon.svg'
import FortmaticIcon from '../../assets/images/fortmaticIcon.png'
import PortisIcon from '../../assets/images/portisIcon.png'
import WalletConnectIcon from '../../assets/images/walletConnectIcon.svg'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { fortmatic, injected, portis, walletconnect, walletlink } from '../../connectors'
import { AppDispatch } from '../../state'
import { clearAllTransactions } from '../../state/transactions/actions'
import { ExternalLink, LinkStyledButton, TYPE } from '../../theme'
import { getEtherscanLink, shortenAddress } from '../../utils'
import { ButtonOutlined, ButtonPrimary, ButtonSecondary } from '../Button'
import Identicon from '../Identicon'
import { AutoRow } from '../Row'
import Transaction from './Transaction'

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

const WalletAction = styled(ButtonSecondary)`
  width: fit-content;
  font-weight: 400;
  margin-left: 8px;
  font-size: 0.825rem;
  padding: 4px 6px;
  :hover {
    cursor: pointer;
    text-decoration: underline;
  }
`

const MainWalletAction = styled(WalletAction)`
  color: ${({ theme }) => theme.primary};
`

function renderTransactions(transactions: string[]) {
  return (
    <TransactionListWrapper>
      {transactions.map((hash, i) => {
        return <Transaction key={i} hash={hash} />
      })}
    </TransactionListWrapper>
  )
}

interface AccountDetailsProps {
  toggleWalletModal: () => void
  pendingTransactions: string[]
  confirmedTransactions: string[]
  ENSName?: string
  openOptions: () => void
}

export default function AccountDetails({
  toggleWalletModal,
  pendingTransactions,
  confirmedTransactions,
  ENSName,
  openOptions,
}: AccountDetailsProps) {
  const { chainId, account, connector, deactivate } = useWeb3React()
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()

  function formatConnectorName() {
    const { ethereum } = window
    const isMetaMask = !!(ethereum && ethereum.isMetaMask)
    const name = Object.keys(SUPPORTED_WALLETS)
      .filter(
        k =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK')),
      )
      .map(k => SUPPORTED_WALLETS[k].name)[0]

    return (
      <WalletName>
        <Trans>Connected with {name}</Trans>
      </WalletName>
    )
  }

  function getStatusIcon() {
    if (connector === injected) {
      return (
        <IconWrapper size={20}>
          <Identicon />
        </IconWrapper>
      )
    } else if (connector === walletconnect) {
      return (
        <IconWrapper size={20}>
          <img src={WalletConnectIcon} alt={'wallet connect logo'} />
        </IconWrapper>
      )
    } else if (connector === walletlink) {
      return (
        <IconWrapper size={20}>
          <img src={CoinbaseWalletIcon} alt={'coinbase wallet logo'} />
        </IconWrapper>
      )
    } else if (connector === fortmatic) {
      return (
        <IconWrapper size={20}>
          <img src={FortmaticIcon} alt={'fortmatic logo'} />
        </IconWrapper>
      )
    } else if (connector === portis) {
      return (
        <>
          <IconWrapper size={20}>
            <img src={PortisIcon} alt={'portis logo'} />
            <MainWalletAction
              onClick={() => {
                portis.portis.showPortis()
              }}
            >
              <Trans>Show Portis</Trans>
            </MainWalletAction>
          </IconWrapper>
        </>
      )
    }
    return null
  }

  const clearAllTransactionsCallback = useCallback(() => {
    if (chainId) dispatch(clearAllTransactions({ chainId }))
  }, [dispatch, chainId])

  const [, setIsUserManuallyDisconnect] = useLocalStorage('user-manually-disconnect')

  const handleDisconnect = () => {
    deactivate()

    // @ts-expect-error close can be returned by wallet
    if (connector && connector.close) connector.close()
    setIsUserManuallyDisconnect(true)
  }

  return (
    <>
      <UpperSection>
        <HeaderRow>
          <Trans>Account</Trans>
          <CloseIcon onClick={toggleWalletModal}>
            <CloseColor />
          </CloseIcon>
        </HeaderRow>

        <Flex flexDirection="column" marginTop="8px" paddingX="20px">
          {formatConnectorName()}

          <YourAccount>
            <AccountGroupingRow id="web3-account-identifier-row">
              <AccountControl>
                {ENSName ? (
                  <>
                    <div>
                      {getStatusIcon()}
                      <p> {ENSName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      {getStatusIcon()}
                      <p> {isMobile && account ? shortenAddress(account, 10) : account}</p>
                    </div>
                  </>
                )}
              </AccountControl>
            </AccountGroupingRow>

            <CopyHelper toCopy={account || ''} />
          </YourAccount>
        </Flex>

        <Flex justifyContent="space-between" marginTop="24px" paddingX="20px">
          <ExternalLink href={getEtherscanLink(chainId || ChainId.MAINNET, ENSName || account || '', 'address')}>
            <Flex alignItems="center">
              <FileText size={16} />
              <Text marginLeft="4px" fontSize="14px">
                <Trans>View Transactions</Trans> ↗
              </Text>
            </Flex>
          </ExternalLink>

          <ExternalLink href={`${PROMM_ANALYTICS_URL[chainId as ChainId]}/account/${account}`}>
            <Flex alignItems="center">
              <Wallet size={16} />
              <Text fontSize="14px" marginLeft="4px">
                <Trans>Analyze Wallet</Trans> ↗
              </Text>
            </Flex>
          </ExternalLink>
        </Flex>

        <Flex justifyContent="space-between" marginTop="24px" paddingX="20px" sx={{ gap: '1rem' }}>
          <ButtonOutlined onClick={handleDisconnect}>
            <Trans>Disconnect</Trans>
          </ButtonOutlined>
          <ButtonPrimary
            onClick={() => {
              openOptions()
            }}
          >
            <Trans>Change Wallet</Trans>
          </ButtonPrimary>
        </Flex>
      </UpperSection>

      <Flex marginTop="24px" paddingX="20px" width="100%">
        <Divider style={{ width: '100%' }} />
      </Flex>
      {!!pendingTransactions.length || !!confirmedTransactions.length ? (
        <LowerSection>
          <AutoRow mb={'1rem'} style={{ justifyContent: 'space-between' }}>
            <TYPE.body>
              <Trans>Recent Transactions</Trans>
            </TYPE.body>
            <LinkStyledButton onClick={clearAllTransactionsCallback}>(clear all)</LinkStyledButton>
          </AutoRow>
          {renderTransactions(pendingTransactions.slice(0, 5))}
          {renderTransactions(confirmedTransactions.slice(0, 5))}
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
