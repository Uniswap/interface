import { ChainId, Currency } from '@teleswap/sdk'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import useThemedContext from 'hooks/useThemedContext'
import React from 'react'
import { AlertTriangle, ArrowUpCircle, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { useActiveWeb3React } from '../../hooks'
import { ExternalLink } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme/components'
import { getEtherscanLink } from '../../utils'
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
  // background-color: rgba(5, 5, 14, 0.8);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding-top: 0;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 3rem 0;
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
        <AutoColumn gap="1rem" justify={'center'}>
          <Text className="secondary-title" fontWeight={600}>
            Waiting For Confirmation
          </Text>
        </AutoColumn>
        <ConfirmedIcon>
          <CustomLightSpinner src={Circle} alt="loader" size={'4rem'} />
        </ConfirmedIcon>
        <AutoColumn gap="1rem" justify={'center'}>
          <AutoColumn gap="1rem" justify={'center'}>
            <Text className="text-emphasize" fontWeight={400} color="" textAlign="center">
              {pendingText}
            </Text>
          </AutoColumn>
          <Text className="text-detail" color="#565A69" textAlign="center">
            Confirm this transaction in your wallet
          </Text>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: ChainId
  currencyToAdd?: Currency | undefined
}) {
  const theme = useThemedContext()

  const { library } = useActiveWeb3React()

  const { addToken, success } = useAddTokenToMetamask(currencyToAdd)

  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn gap="1rem" justify={'center'}>
          <Text className="secondary-title" fontWeight={600}>
            Transaction Submitted
          </Text>
        </AutoColumn>
        <ConfirmedIcon>
          <ArrowUpCircle strokeWidth={0.5} size={'4rem'} color={theme.primary1} />
        </ConfirmedIcon>
        <AutoColumn gap="0.8rem" justify={'center'}>
          {chainId && hash && (
            <ExternalLink href={getEtherscanLink(chainId, hash, 'transaction')}>
              <Text className="text-emphasize" fontWeight={400} fontFamily="Poppins" color={theme.primary1}>
                View on Blockchain Exploerer
              </Text>
            </ExternalLink>
          )}
          {currencyToAdd && library?.provider?.isMetaMask && (
            <ButtonLight
              className="text-emphasize"
              fontWeight={400}
              fontFamily="Poppins"
              mt="12px"
              padding="6px 12px"
              width="fit-content"
              onClick={addToken}
            >
              {!success ? (
                <RowFixed>
                  Add {currencyToAdd.symbol} to Metamask <StyledLogo src={MetaMaskLogo} />
                </RowFixed>
              ) : (
                <RowFixed>
                  Added {currencyToAdd.symbol}{' '}
                  <CheckCircle size={'16px'} stroke={theme.green1} style={{ marginLeft: '6px' }} />
                </RowFixed>
              )}
            </ButtonLight>
          )}
          <ButtonPrimary onClick={onDismiss} style={{ margin: '1rem 0 0 0', maxHeight: '4rem' }}>
            <Text className="title" fontWeight={400} fontFamily="Poppins">
              Close
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

// const BorderWrapper = styled(Box)`
//   // border: 1px solid rgba(255, 255, 255, 0.2);
//   border: 1px solid rgba(0, 0, 0, 0.2); //test usage
//   border-radius: 24px;
// `

export function AddLiquidityConfirmationModalContent({
  bottomContent,
  onDismiss,
  topContent
}: {
  onDismiss: () => void
  topContent: () => React.ReactNode
  bottomContent: () => React.ReactNode
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text className="title" fontWeight={600}>
            {'Add Liquidity'}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {topContent()}
      </Section>
      <BottomSection gap="12px">{bottomContent()}</BottomSection>
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
  bottomContent?: () => React.ReactNode
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text
            color={'#FFFFFF'}
            fontFamily="Poppins"
            fontStyle="normal"
            fontWeight={600}
            className="title"
            lineHeight="1.2rem"
          >
            {title}
          </Text>
          <CloseIcon color="white" onClick={onDismiss} />
        </RowBetween>
        {topContent()}
      </Section>
      {bottomContent && <BottomSection gap="1rem">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const theme = useThemedContext()
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            Error
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
          <Text fontWeight={500} fontSize={16} color={theme.red1} style={{ textAlign: 'center', width: '85%' }}>
            {message}
          </Text>
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <ButtonPrimary onClick={onDismiss}>Dismiss</ButtonPrimary>
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
  currencyToAdd?: Currency | undefined
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd
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
          currencyToAdd={currencyToAdd}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}
