import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { ArrowUpCircle, BarChart2 } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as Alert } from 'assets/images/alert.svg'
import Banner from 'components/Banner'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn, ColumnCenter } from 'components/Column'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { RowBetween, RowFixed } from 'components/Row'
import ListGridViewGroup from 'components/YieldPools/ListGridViewGroup'
import HurryUpBanner from 'components/swapv2/HurryUpBanner'
import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { ExternalLink } from 'theme'
import { CloseIcon } from 'theme/components'
import { getEtherscanLink, getTokenLogoURL } from 'utils'
import { errorFriendly } from 'utils/dmm'

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

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  startedTime,
}: {
  onDismiss: () => void
  pendingText: string | React.ReactNode
  startedTime: number | undefined
}) {
  const theme = useTheme()

  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <ConfirmedIcon>
          <Loader size="90px" stroke={theme.primary} strokeWidth="1" />
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
        <HurryUpBanner startedTime={startedTime} />
      </Section>
    </Wrapper>
  )
}

function AddTokenToInjectedWallet({ token, chainId }: { token: Token; chainId: ChainId }) {
  const isDarkMode = useIsDarkMode()
  const { walletKey, isEVM } = useActiveWeb3React()
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

  if (!walletKey) return null
  if (!isEVM) return null
  const walletConfig = SUPPORTED_WALLETS[walletKey]

  return (
    <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={handleClick}>
      <RowFixed>
        <Trans>
          Add {token.symbol} to {walletConfig.name}
        </Trans>{' '}
        <StyledLogo src={isDarkMode ? walletConfig.icon : walletConfig.iconLight} />
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
        {showTxBanner && <Banner isInModal />}

        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary} />
        </ConfirmedIcon>
        <AutoColumn gap="16px" justify={'center'}>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Transaction Submitted</Trans>
          </Text>
          {hash && (
            <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
              <Text fontWeight={500} fontSize={14} color={theme.primary}>
                <Trans>View transaction</Trans>
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
  showGridListOption = false,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: string
  showGridListOption?: boolean
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
          <Flex
            sx={{
              gap: '18px',
              alignItems: 'center',
            }}
          >
            {showGridListOption && <ListGridViewGroup customIcons={{ [VIEW_MODE.GRID]: <BarChart2 size="28px" /> }} />}
            <CloseIcon onClick={onDismiss} />
          </Flex>
        </RowBetween>
        {topContent()}
      </Section>

      <BottomSection gap="0">{bottomContent()}</BottomSection>
    </Wrapper>
  )
}

const ErrorDetail = styled(Section)`
  padding: 12px;
  word-break: break-word;
  max-height: 200px;
  overflow-y: scroll;
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
  const [showDetail, setShowDetail] = useState<boolean>(true)
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
              {showDetail && (
                <ErrorDetail>{typeof message === 'string' ? message : JSON.stringify(message)}</ErrorDetail>
              )}
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
  startedTime?: number
  maxWidth?: string | number
  width?: string
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
  startedTime,
  maxWidth = 420,
  width,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={90}
      maxWidth={!attemptingTxn && !hash ? maxWidth : undefined}
      width={!attemptingTxn && !hash ? width : undefined}
    >
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} startedTime={startedTime} />
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
