import { Currency } from '@uniswap/sdk-core'
import { ReactNode, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components/macro'
import { getExplorerLink, ExplorerDataType } from '../../utils/getExplorerLink'
import Modal from '../Modal'
import { ExternalLink } from '../../theme'
import { Text } from 'rebass'
import { CloseIcon, CustomLightSpinner } from '../../theme/components'
import { RowBetween, RowFixed } from '../Row'
import { AlertCircle, AlertTriangle, ArrowUpCircle, CheckCircle } from 'react-feather'
import { ButtonPrimary, ButtonLight } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { useActiveWeb3React } from '../../hooks/web3'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { Trans } from '@lingui/macro'
import { CHAIN_INFO, L2_CHAIN_IDS, SupportedL2ChainId } from 'constants/chains'
import { useIsTransactionConfirmed, useIsTransactionPending, useTransaction } from 'state/transactions/hooks'
import Badge from 'components/Badge'

const Wrapper = styled.div`
  width: 100%;
  padding: 1rem;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '60px 0;')};
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  inline,
  hideSubmittedView,
}: {
  onDismiss: () => void
  pendingText: ReactNode
  inline?: boolean // not in modal
  hideSubmittedView?: boolean // stay on loading screen - used for L2s
}) {
  return (
    <Wrapper>
      <AutoColumn gap="md">
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            {hideSubmittedView ? <Trans>Transaction Submitted</Trans> : <Trans>Waiting For Confirmation</Trans>}
          </Text>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={600} fontSize={14} color="" textAlign="center">
              {pendingText}
            </Text>
          </AutoColumn>
          {hideSubmittedView ? (
            <Text fontSize={12} color="#565A69" textAlign="center" marginBottom={12}>
              <Trans>Waiting for confirmation</Trans>
            </Text>
          ) : (
            <Text fontSize={12} color="#565A69" textAlign="center" marginBottom={12}>
              <Trans>Confirm this transaction in your wallet</Trans>
            </Text>
          )}
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
  inline,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  inline?: boolean // not in modal
}) {
  const theme = useContext(ThemeContext)

  const { library } = useActiveWeb3React()

  const { addToken, success } = useAddTokenToMetamask(currencyToAdd)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // convert unix time difference to seconds
  const secondsToConfirm = transaction?.confirmedTime
    ? (transaction.confirmedTime - transaction.addedTime) / 1000
    : undefined

  const info = CHAIN_INFO[chainId as SupportedL2ChainId]

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            {L2_CHAIN_IDS.includes(chainId) ? (
              <Badge>
                <RowFixed>
                  <StyledLogo src={info.logoUrl} style={{ margin: '0 8px 0 0' }} />
                  {info.label}
                </RowFixed>
              </Badge>
            ) : (
              <div></div>
            )}
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        {confirmed ? (
          <ConfirmedIcon inline={inline}>
            {transactionSuccess ? (
              <CheckCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.green1} />
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.red1} />
            )}
          </ConfirmedIcon>
        ) : (
          <ConfirmedIcon inline={inline}>
            <ArrowUpCircle strokeWidth={0.5} size={inline ? '40px' : '90px'} color={theme.primary1} />
          </ConfirmedIcon>
        )}
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={24} textAlign="center">
            {transactionSuccess ? (
              <Trans>Error</Trans>
            ) : confirmed ? (
              <Trans>Success</Trans>
            ) : (
              <Trans>Transaction Submitted</Trans>
            )}
          </Text>
          {!transaction ? null : (
            <Text fontWeight={400} fontSize={16} textAlign="center">
              {transaction?.summary}
            </Text>
          )}
          {chainId && hash && (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                <Trans>View on Explorer</Trans>
              </Text>
            </ExternalLink>
          )}
          {currencyToAdd && library?.provider?.isMetaMask && (
            <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToken}>
              {!success ? (
                <RowFixed>
                  <Trans>
                    Add {currencyToAdd.symbol} to Metamask <StyledLogo src={MetaMaskLogo} />
                  </Trans>
                </RowFixed>
              ) : (
                <RowFixed>
                  <Trans>Added {currencyToAdd.symbol} </Trans>
                  <CheckCircle size={'16px'} stroke={theme.green1} style={{ marginLeft: '6px' }} />
                </RowFixed>
              )}
            </ButtonLight>
          )}
          {!secondsToConfirm ? null : (
            <Text color={theme.text3} style={{ margin: '20px 0 0 0' }} fontSize={'14px'}>
              <Trans>Transaction completed in </Trans>
              <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.text1 }}>
                <Trans>{secondsToConfirm}</Trans> seconds 🎉
              </span>
            </Text>
          )}
          <ButtonPrimary onClick={onDismiss} style={{ margin: secondsToConfirm ? '4px 0 0 0' : '20px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
              {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
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
  title: ReactNode
  onDismiss: () => void
  topContent: () => ReactNode
  bottomContent?: () => ReactNode | undefined
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            {title}
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {topContent()}
      </Section>
      {bottomContent && <BottomSection gap="12px">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: ReactNode; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Error</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
          <Text
            fontWeight={500}
            fontSize={16}
            color={theme.red1}
            style={{ textAlign: 'center', width: '85%', wordBreak: 'break-word' }}
          >
            {message}
          </Text>
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
  content: () => ReactNode
  attemptingTxn: boolean
  pendingText: ReactNode
  currencyToAdd?: Currency | undefined
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  const pending = useIsTransactionPending(hash)

  // on L2, keep loading state while txn confirms
  // dont want to show the submitted view as txns confirm so quickly
  const l2TxnWaitingToConfirm = Boolean(pending && chainId && L2_CHAIN_IDS.includes(chainId))

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {attemptingTxn || l2TxnWaitingToConfirm ? (
        <ConfirmationPendingContent
          onDismiss={onDismiss}
          pendingText={pendingText}
          hideSubmittedView={l2TxnWaitingToConfirm}
        />
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
