import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Badge from 'components/Badge'
import { CHAIN_INFO } from 'constants/chainInfo'
import { L2_CHAIN_IDS, SupportedL2ChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import useInterval from 'lib/hooks/useInterval'
import { ReactNode, useContext, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { ThemedText } from 'theme'

import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { ExternalLink } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import AnimatedConfirmation from './AnimatedConfirmation'

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
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
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
}: {
  onDismiss: () => void
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const [progressBarValue, setProgressBarValue] = useState<number>(0)

  useInterval(() => {
    if (progressBarValue < 100) {
      setProgressBarValue(progressBarValue + 1)
    }
  }, 100)

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
            <Trans>Waiting For Confirmation</Trans>
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            {pendingText}
          </Text>
          <div style={{ marginBottom: 12 }} />
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
  swapResponse,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  inline?: boolean // not in modal
  swapResponse?: RadiusSwapResponse | undefined
}) {
  const theme = useContext(ThemeContext)

  const { library } = useActiveWeb3React()

  const { addToken, success } = useAddTokenToMetamask(currencyToAdd)

  const [progressBarValue, setProgressBarValue] = useState<number>(0)

  const showConfirmMessage = progressBarValue >= 6000 && swapResponse

  const txHash = 'test'

  useInterval(() => {
    if (progressBarValue < 100) {
      setProgressBarValue(progressBarValue + 1)
    }
  }, 80)

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <div style={{ margin: 20 }}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            <Trans>1. Transaction Encryption</Trans>
          </Text>
        </div>
        <RowBetween>
          <RowFixed>
            <ThemedText.Black fontSize={14} fontWeight={400} color={'#565A69'}>
              {'Encryption Progress'}
            </ThemedText.Black>
            <QuestionHelper text="Your VDF is currently being generated. Once the VDF is generated, your transaction would be submitted. Please wait for the progress bar to reach the end." />
          </RowFixed>
          <RowFixed>
            {progressBarValue < 100 ? (
              <ThemedText.Blue fontSize={14}>{'In Progress'}</ThemedText.Blue>
            ) : (
              <ThemedText.Blue fontSize={14}>{'Complete'}</ThemedText.Blue>
            )}
          </RowFixed>
        </RowBetween>
        <div style={{ padding: 5 }} />
        {/* <ProgressBar
            completed={progressBarValue}
            labelSize={'12px'}
            transitionDuration={'0.2s'}
            transitionTimingFunction={'ease-in-out'}
            labelAlignment={'outside'}
            labelColor={'#ef9231'}
            bgColor={'#ef9231'}
          /> */}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <div style={{ marginBottom: 30 }} />

        {showConfirmMessage && (
          <>
            <AutoColumn gap="12px" justify={'center'}>
              <Text fontWeight={500} fontSize={20} textAlign="center">
                <Trans>2. Transaction Submitted</Trans>
              </Text>
              <Text fontWeight={500} fontSize={14}>
                <Trans>
                  Round: {swapResponse.data.round}, Order: {swapResponse.data.order}
                </Trans>
              </Text>
              <Text fontWeight={500} fontSize={14}>
                <Trans>
                  Transaction Hash: {txHash?.substring(0, 4)}...{txHash?.substring(txHash.length - 4, txHash.length)}
                </Trans>
              </Text>
              <Text fontWeight={400} fontSize={14} color={'#565A69'}>
                <Trans>Your transaction would be executed on fixed order.</Trans>
              </Text>
              {chainId && txHash && (
                <ExternalLink href={getExplorerLink(chainId, txHash, ExplorerDataType.TRANSACTION)}>
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
              <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
                <Text fontWeight={500} fontSize={20}>
                  {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
                </Text>
              </ButtonPrimary>
            </AutoColumn>
          </>
        )}
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

function L2Content({
  swapResponse,
  onDismiss,
  chainId,
  hash,
  pendingText,
  inline,
}: {
  swapResponse: RadiusSwapResponse
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useContext(ThemeContext)

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
          <RowBetween mb="16px">
            <Badge>
              <RowFixed>
                <StyledLogo src={info.logoUrl} style={{ margin: '0 8px 0 0' }} />
                {info.label}
              </RowFixed>
            </Badge>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          {confirmed ? (
            transactionSuccess ? (
              <>
                <AnimatedConfirmation />
              </>
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.red1} />
            )
          ) : (
            // <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
            <AnimatedConfirmation />
          )}
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            {!hash ? (
              <Trans>Confirm transaction in wallet</Trans>
            ) : !confirmed ? (
              <Trans>Transaction Submitted</Trans>
            ) : transactionSuccess ? (
              <Trans>Success</Trans>
            ) : (
              <Trans>Error</Trans>
            )}
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            <>
              {transaction ? <TransactionSummary info={transaction.info} /> : pendingText}
              {!confirmed && (
                <>
                  <Text fontWeight={500} fontSize={14} marginTop={20}>
                    <Trans>
                      Round: {swapResponse.data.round}, Order: {swapResponse.data.order}
                    </Trans>
                  </Text>
                  <Text fontWeight={400} fontSize={14} color={'#565A69'} marginTop={10}>
                    <Trans>Your transaction would be executed on fixed order.</Trans>
                  </Text>
                </>
              )}
              {confirmed && transactionSuccess && (
                <>
                  <Text fontWeight={500} fontSize={14} marginTop={20}>
                    <Trans>
                      Round: {swapResponse.data.round}, Order: {swapResponse.data.order}
                    </Trans>
                  </Text>
                  <Text fontWeight={400} fontSize={14} color={'#565A69'} marginTop={10}>
                    <Trans>Your transaction was executed on fixed order.</Trans>
                  </Text>
                </>
              )}
            </>
          </Text>
          {chainId && hash ? (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                <Trans>View on Explorer</Trans>
              </Text>
            </ExternalLink>
          ) : (
            <div style={{ height: '17px' }} />
          )}
          <Text color={theme.text3} style={{ margin: '20px 0 0 0' }} fontSize={'14px'}>
            {!secondsToConfirm ? (
              <div style={{ height: '24px' }} />
            ) : (
              <div>
                <Trans>Transaction completed in </Trans>
                <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.text1 }}>
                  {secondsToConfirm} seconds 🎉
                </span>
              </div>
            )}
          </Text>
          <ButtonPrimary onClick={onDismiss} style={{ margin: '4px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
              {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
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
  swapResponse?: RadiusSwapResponse | undefined
  showVdf?: boolean
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
  swapResponse,
  showVdf,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
      {isL2 && swapResponse && (hash || attemptingTxn) ? (
        <L2Content
          swapResponse={swapResponse}
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          pendingText={pendingText}
        />
      ) : attemptingTxn ? (
        <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
      ) : hash || showVdf ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          currencyToAdd={currencyToAdd}
          swapResponse={swapResponse}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}
