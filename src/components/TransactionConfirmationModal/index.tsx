import { ChainId, Currency, Token } from '@dynamic-amm/sdk'
import React, { useContext, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Trans } from '@lingui/macro'
import Modal from '../Modal'
import { ExternalLink } from '../../theme'
import { Text } from 'rebass'
import { CloseIcon, CustomLightSpinner } from '../../theme/components'
import { RowBetween, RowFixed } from '../Row'
import { AlertTriangle, ArrowUpCircle } from 'react-feather'
import { ReactComponent as Alert } from '../../assets/images/alert.svg'
import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'

import { getEtherscanLink, getEtherscanLinkText, getTokenLogoURL } from '../../utils'
import { useActiveWeb3React } from '../../hooks'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
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
  padding: 60px 0;
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`
function ConfirmationPendingContent({ onDismiss, pendingText }: { onDismiss: () => void; pendingText: string }) {
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

function AddTokenToMetaMask({ token, chainId }: { token: Token; chainId: ChainId }) {
  async function addToMetaMask() {
    const tokenAddress = token.address
    const tokenSymbol = token.symbol
    const tokenDecimals = token.decimals
    const tokenImage = getTokenLogoURL(token.address, chainId)

    try {
      const { ethereum } = window
      const isMetaMask = !!(ethereum && ethereum.isMetaMask)
      if (isMetaMask) {
        await (window.ethereum as any).request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage
            }
          }
        })
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToMetaMask}>
      <RowFixed>
        <Trans>Add {token.symbol} to Metamask</Trans> <StyledLogo src={MetaMaskLogo} />
      </RowFixed>
    </ButtonLight>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  tokenAddtoMetaMask
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: ChainId
  tokenAddtoMetaMask?: Token
}) {
  const theme = useContext(ThemeContext)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Transaction Submitted</Trans>
          </Text>
          {chainId && hash && (
            <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                {getEtherscanLinkText(chainId)}
              </Text>
            </ExternalLink>
          )}
          {tokenAddtoMetaMask?.address && <AddTokenToMetaMask token={tokenAddtoMetaMask} chainId={chainId} />}
          <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
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
  topContent
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
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => `${theme.bg12}66`};
  font-size: 10px;
  width: 100%;
  text-align: center;
`

const StyledAlert = styled(Alert)`
  height: 108px;
  width: 108px;
`
export function TransactionErrorContent({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)
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
          <Text fontWeight={500} fontSize={16} color={theme.red} style={{ textAlign: 'center', width: '85%' }}>
            {errorFriendly(message)}
            {/* {message.includes('minTotalAmountOut') &&
              ' Try to refresh the exchange rate or increase the Slippage tolerance in Settings'} */}
          </Text>
          <AutoColumn justify="center" style={{ width: '100%' }}>
            <Text
              color={theme.primary1}
              fontSize="14px"
              sx={{ cursor: `pointer` }}
              onClick={() => setShowDetail(!showDetail)}
            >
              Show more details
            </Text>
            {showDetail && <ErrorDetail>{message}</ErrorDetail>}
          </AutoColumn>
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
  pendingText: string
  tokenAddtoMetaMask?: Currency
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  tokenAddtoMetaMask
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          tokenAddtoMetaMask={tokenAddtoMetaMask as Token}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}
