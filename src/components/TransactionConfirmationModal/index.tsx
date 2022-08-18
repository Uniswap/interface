import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { ArrowUpCircle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import Circle from 'assets/images/blue-loader.svg'
import Banner from 'components/Banner'
import { SUPPORTED_WALLETS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { CloseIcon, CustomLightSpinner } from 'theme/components'
import { getEtherscanLink, getEtherscanLinkText, getTokenLogoURL } from 'utils'
import { errorFriendly } from 'utils/dmm'

import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween, RowFixed } from '../Row'

const Wrapper = styled.div`
  width: 100%;
`
const Section = styled(AutoColumn)`
  padding: 24px;
`

const BottomSection = styled(Section)`
  padding-top: 0;
  padding-bottom: 28px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 30px 0;
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

const getBrowserWalletConfig = () => {
  const { ethereum } = window
  const hasInjectedWallet = !!ethereum
  const { isCoin98, isBraveWallet, isMetaMask } = ethereum || {}

  if (hasInjectedWallet) {
    if (isCoin98) {
      const { name, iconName } = SUPPORTED_WALLETS.COIN98
      return { name, iconName }
    }

    if (isBraveWallet) {
      const { name, iconName } = SUPPORTED_WALLETS.BRAVE
      return { name, iconName }
    }

    if (isMetaMask) {
      const { name, iconName } = SUPPORTED_WALLETS.METAMASK
      return { name, iconName }
    }

    const config = SUPPORTED_WALLETS.INJECTED
    return {
      name: t`your wallet`,
      iconName: config.iconName,
    }
  }

  return undefined
}

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
}: {
  onDismiss: () => void
  pendingText: string | React.ReactNode
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <ConfirmedIcon>
          <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Waiting For Confirmation</Trans>
          </Text>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={600} fontSize={14} color="" textAlign="center">
              {pendingText}
            </Text>
          </AutoColumn>
          <Text fontSize={12} color="#565A69" textAlign="center">
            <Trans>Confirm this transaction in your wallet</Trans>
          </Text>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

function AddTokenToInjectedWallet({ token, chainId }: { token: Token; chainId: ChainId }) {
  const isDarkMode = useIsDarkMode()

  const handleClick = async () => {
    const tokenAddress = token.address
    const tokenSymbol = token.symbol
    const tokenDecimals = token.decimals
    const tokenImage = getTokenLogoURL(token.address, chainId)

    try {
      const hasInjectedWallet = !!window.ethereum
      if (hasInjectedWallet) {
        await (window.ethereum as any).request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage,
            },
          },
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const walletConfig = getBrowserWalletConfig()
  if (!walletConfig) {
    return null
  }

  return (
    <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={handleClick}>
      <RowFixed>
        <Trans>
          Add {token.symbol} to {walletConfig.name}
        </Trans>{' '}
        <StyledLogo
          src={require(`../../assets/images/${isDarkMode ? '' : 'light-'}${walletConfig.iconName}`).default}
        />
      </RowFixed>
    </ButtonLight>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  tokenAddToMetaMask,
  showTxBanner = true,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: ChainId
  tokenAddToMetaMask?: Token
  showTxBanner?: boolean
}) {
  const theme = useTheme()
  const hasInjectedWallet = !!window.ethereum

  return (
    <Wrapper>
      <Section>
        {!showTxBanner && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        {showTxBanner && (
          <>
            <Banner isInModal />
          </>
        )}

        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary} />
        </ConfirmedIcon>
        <AutoColumn gap="16px" justify={'center'}>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Transaction Submitted</Trans>
          </Text>
          {chainId && hash && (
            <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
              <Text fontWeight={500} fontSize={14} color={theme.primary}>
                {getEtherscanLinkText(chainId)}
              </Text>
            </ExternalLink>
          )}
          {hasInjectedWallet && tokenAddToMetaMask?.address && (
            <AddTokenToInjectedWallet token={tokenAddToMetaMask} chainId={chainId} />
          )}
          <ButtonPrimary onClick={onDismiss} style={{ margin: '24px 0 0 0' }}>
            <Text fontWeight={500} fontSize={14}>
              <Trans>Close</Trans>
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: string
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {topContent()}
      </Section>

      <BottomSection gap="0">{bottomContent()}</BottomSection>
    </Wrapper>
  )
}

const ErrorDetail = styled(Section)`
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  color: ${({ theme }) => theme.text};
  background-color: ${({ theme }) => `${theme.buttonBlack}66`};
  font-size: 10px;
  width: 100%;
  text-align: center;
  line-height: 16px;
`

const StyledAlert = styled(Alert)`
  height: 108px;
  width: 108px;
`
export function TransactionErrorContent({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const theme = useTheme()
  const [showDetail, setShowDetail] = useState<boolean>(false)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Error</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20 }} gap="8px" justify="center">
          <StyledAlert />
          <Text
            fontWeight={500}
            fontSize={16}
            color={theme.red}
            lineHeight={'24px'}
            style={{ textAlign: 'center', width: '85%' }}
          >
            {errorFriendly(message)}
            {/* {message.includes('minTotalAmountOut') &&
              ' Try to refresh the exchange rate or increase the Slippage tolerance in Settings'} */}
          </Text>
          {message !== errorFriendly(message) && (
            <AutoColumn justify="center" style={{ width: '100%' }}>
              <Text
                color={theme.primary}
                fontSize="14px"
                sx={{ cursor: `pointer` }}
                onClick={() => setShowDetail(!showDetail)}
              >
                Show more details
              </Text>
              {showDetail && <ErrorDetail>{message}</ErrorDetail>}
            </AutoColumn>
          )}
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <ButtonPrimary onClick={onDismiss}>
          <Trans>Dismiss</Trans>
        </ButtonPrimary>
      </BottomSection>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content: () => React.ReactNode
  attemptingTxn: boolean
  pendingText: string | React.ReactNode
  tokenAddToMetaMask?: Currency
  showTxBanner?: boolean
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  tokenAddToMetaMask,
  showTxBanner,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash ? (
        <TransactionSubmittedContent
          showTxBanner={showTxBanner}
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          tokenAddToMetaMask={tokenAddToMetaMask as Token}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}
