import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Badge from 'components/Badge'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId, SupportedL2ChainId } from 'constants/chains'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { ReactNode, useCallback, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowUpCircle, CheckCircle } from 'react-feather'
import { Text } from 'rebass'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { isL2ChainId } from 'utils/chains'

import Circle from '../../assets/images/blue-loader.svg'
import { ExternalLink, ThemedText } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import AnimatedConfirmation from './AnimatedConfirmation'
import { SmallButtonPrimary } from 'components/Button'
import { ReactComponent as LogoGradient } from '../../assets/svg/full_logo_gradient.svg'
import { NumberType, formatNumber } from '@uniswap/conedison/format'
import { useCurrency } from 'hooks/Tokens'
import { ReduceLeveragePositionTransactionInfo, TransactionDetails, TransactionInfo, TransactionType } from 'state/transactions/types'
import PortfolioRow from 'components/WalletDropdown/MiniPortfolio/PortfolioRow'
import { PopupAlertTriangle } from 'components/Popups/FailedNetworkSwitchPopup'
import { parseLocalActivity } from 'components/WalletDropdown/MiniPortfolio/Activity/parseLocal'
import { useCombinedActiveList } from 'state/lists/hooks'
import { Descriptor } from 'components/Popups/TransactionPopup'
import backgroundImage from 'assets/images/visualbg.png'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.backgroundFloating};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.backgroundOutline};
  width: 100%;
  padding: 1rem;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding-bottom: 10px;
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
  const theme = useTheme()

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
        <AutoColumn gap="md" justify="center">
          <Text fontWeight={500} fontSize={20} color={theme.textPrimary} textAlign="center">
            <Trans>Waiting for confirmation</Trans>
          </Text>
          <Text fontWeight={600} fontSize={16} color={theme.textPrimary} textAlign="center">
            {pendingText}
          </Text>
          <Text fontWeight={400} fontSize={12} color={theme.textSecondary} textAlign="center" marginBottom="12px">
            <Trans>Confirm this transaction in your wallet</Trans>
          </Text>
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}

export function TransactionSubmittedContent({
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
  const theme = useTheme()

  const { connector } = useWeb3React()

  const token = currencyToAdd?.wrapped
  const logoURL = useCurrencyLogoURIs(token)[0]

  const [success, setSuccess] = useState<boolean | undefined>()

  const addToken = useCallback(() => {
    if (!token?.symbol || !connector.watchAsset) return
    connector
      .watchAsset({
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        image: logoURL,
      })
      .then(() => setSuccess(true))
      .catch(() => setSuccess(false))
  }, [connector, logoURL, token])

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          <ArrowUpCircle strokeWidth={1} size={inline ? '40px' : '75px'} color={theme.accentActive} />
        </ConfirmedIcon>
        <AutoColumn gap="md" justify="center" style={{ paddingBottom: '12px' }}>
          <ThemedText.MediumHeader textAlign="center">
            <Trans>Transaction submitted</Trans>
          </ThemedText.MediumHeader>
          {currencyToAdd && connector.watchAsset && (
            <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToken}>
              {!success ? (
                <RowFixed>
                <Text color={theme.accentTextLightPrimary}>
                  <Trans>Add {currencyToAdd.symbol}</Trans>
                </Text>
                </RowFixed>
              ) : (
                <RowFixed>
                <Text color={theme.accentTextLightPrimary}>
                  <Trans>Added {currencyToAdd.symbol}</Trans>
                </Text>                
                  <CheckCircle size="16px" stroke={theme.accentSuccess} style={{ marginLeft: '6px' }} />
                </RowFixed>
              )}
            </ButtonLight>
          )}
          <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
            <Text fontWeight={600} fontSize={20} color={theme.accentTextLightPrimary}>
              {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
            </Text>
          </ButtonPrimary>
          {chainId && hash && (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={600} fontSize={14} color={theme.accentTextLightPrimary}>
                <Trans>View on {chainId === SupportedChainId.MAINNET ? 'Etherscan' : 'Block Explorer'}</Trans>
              </Text>
            </ExternalLink>
          )}
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}


const ReduceWrapper = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: flex-start;
  background-image: url(${backgroundImage});
  background-size: contain;
  background-repeat: no-repeat;
  border-radius: 20px;
  opacity: 1;
  outline: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 1.25rem;
`


export interface TransactionPositionDetails {
  pnl: number,
  initialCollateral: number,
  inputCurrencyId: string,
  outputCurrencyId: string,
  entryPrice: number,
  markPrice: number,
  leverageFactor: number,
  quoteBaseSymbol: string
}

const AmboyText = styled.div<{ color: string, size: number}>`
  font-family: 'Parkinson Amboy Black', Roboto;
  font-size: ${({size}) => size}px;
  color: ${({color}) => color};
`

const AgencyB = styled.div<{color: string, size: number}>`
  font-family: 'AGENCYB', Roboto;
  font-size: ${({size}) => size}px;
  color: ${({color}) => color};
`
const CenterRow = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
`

const CloseItem = styled.div`
  align-self: flex-end;
  justify-self: flex-end;
`

export function  ReduceLeverageTransactionPopupContent({ tx, chainId, removeThisPopup }: {tx: TransactionDetails, chainId: number, removeThisPopup: () => void}) {
  const theme = useTheme()

  const { connector } = useWeb3React()
  const tokens = useCombinedActiveList()
  const activity = parseLocalActivity(tx, chainId, tokens)

  const {
    pnl,
    initialCollateral,
    inputCurrencyId,
    outputCurrencyId,
    entryPrice,
    markPrice,
    leverageFactor,
    quoteBaseSymbol
  } = tx.info as ReduceLeveragePositionTransactionInfo

  const success = tx.receipt?.status === 1



  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  if (!activity) {
    return null
  }

  const explorerUrl = getExplorerLink(chainId, tx.hash, ExplorerDataType.TRANSACTION)

  return (
    success ? (
      <ReduceWrapper>
        <CenterRow>
          <AmboyText size={36} color={"#ffffff"}>
            Closed Position
          </AmboyText>
          <CloseItem>
            <CloseIcon onClick={removeThisPopup}/>
          </CloseItem>
        </CenterRow>
        <AgencyB size={24} color={"#ffffff"}>
          {`${formatNumber(leverageFactor, NumberType.SwapTradeAmount)}x | Long ${inputCurrency?.symbol}/${outputCurrency?.symbol}`}
        </AgencyB>
        <AmboyText size={48} color={pnl > 0 ? "#00ff0c" : "#ff2a00"}>
          {`${formatNumber(pnl/initialCollateral * 100)}%`}
        </AmboyText>
        <AgencyB size={24} color={"#ffffff"}>
        ({pnl > 0 ? `+ ${formatNumber(pnl, NumberType.SwapTradeAmount)} ${inputCurrency?.symbol}` : `${formatNumber(pnl, NumberType.SwapTradeAmount)} ${inputCurrency?.symbol}`})
        </AgencyB>
        <CenterRow>
        <div style={{ "margin": "3px"}}><AgencyB size={24} color={"#ffffff"}>{`Entry Price: `}</AgencyB></div>
          
          <AgencyB size={24} color={'#f600ff'}>{` ${formatNumber(entryPrice)} ${quoteBaseSymbol}`}</AgencyB>
        </CenterRow>
        <CenterRow>
          <div style={{ "margin": "3px"}}>
          <AgencyB size={24} color={"#ffffff"}>{`Mark Price: `}</AgencyB>
          </div>
          <AgencyB size={24} color={'#f600ff'}>{` ${formatNumber(markPrice)} ${quoteBaseSymbol}`}</AgencyB>
        </CenterRow>
        <LogoGradient width={150} height={50}/>
    </ReduceWrapper>
    ) : (
      <PortfolioRow
        left={
          <PopupAlertTriangle/>
        }
        title={<ThemedText.SubHeader fontWeight={500}>{activity.title}</ThemedText.SubHeader>}
        descriptor={
          <Descriptor color="textSecondary">
            {activity.descriptor}
            {/* {ENSName ?? activity.otherAccount} */}
          </Descriptor>
        }
        onClick={() => window.open(explorerUrl, '_blank')}
      />
  ))
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
          <CloseIcon onClick={onDismiss} data-cy="confirmation-close-icon" />
        </RowBetween>
        {topContent()}
      </Section>
      {bottomContent && <BottomSection gap="12px">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: ReactNode; onDismiss: () => void }) {
  const theme = useTheme()
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={600} fontSize={16}>
            <Trans>Error</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.accentCritical} style={{ strokeWidth: 1 }} size={90} />
          <ThemedText.MediumHeader textAlign="center">{message}</ThemedText.MediumHeader>
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
  onDismiss,
  chainId,
  hash,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: SupportedL2ChainId
  currencyToAdd?: Currency | undefined
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useTheme()

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // convert unix time difference to seconds
  const secondsToConfirm = transaction?.confirmedTime
    ? (transaction.confirmedTime - transaction.addedTime) / 1000
    : undefined

  const info = getChainInfo(chainId)

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
              // <CheckCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.accentSuccess} />
              <AnimatedConfirmation />
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.accentFailure} />
            )
          ) : (
            <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
          )}
        </ConfirmedIcon>
        <AutoColumn gap="md" justify="center">
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
            {transaction ? <TransactionSummary info={transaction.info} /> : pendingText}
          </Text>
          {chainId && hash ? (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.accentAction}>
                <Trans>View on Explorer</Trans>
              </Text>
            </ExternalLink>
          ) : (
            <div style={{ height: '17px' }} />
          )}
          <Text color={theme.textTertiary} style={{ margin: '20px 0 0 0' }} fontSize="14px">
            {!secondsToConfirm ? (
              <div style={{ height: '24px' }} />
            ) : (
              <div>
                <Trans>Transaction completed in </Trans>
                <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.textPrimary }}>
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
  positionData?: TransactionPositionDetails | undefined
  currencyToAdd?: Currency | undefined
  setIsLoadingQuote?: (arg:boolean) => void
  isLoadingQuote?: boolean
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
  const { chainId } = useWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onDismiss} maxHeight={90}>
      {isL2ChainId(chainId) && (hash || attemptingTxn) ? (
        <L2Content chainId={chainId} hash={hash} onDismiss={onDismiss} pendingText={pendingText} />
      ) : attemptingTxn ? (
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

export function ReduceLeverageTransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
  positionData
}: ConfirmationModalProps) {
  const { chainId } = useWeb3React()

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onDismiss} maxHeight={90}>
      {isL2ChainId(chainId) && (hash || attemptingTxn) ? (
        <L2Content chainId={chainId} hash={hash} onDismiss={onDismiss} pendingText={pendingText} />
      ) : attemptingTxn ? (
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

// export function LevTransactionConfirmationModal({
//   isOpen,
//   onDismiss,
//   attemptingTxn,
//   hash,
//   pendingText,
//   content,
//   currencyToAdd,

//   setIsLoadingQuote, 
//   isLoadingQuote
// }: ConfirmationModalProps) {
//   const { chainId } = useWeb3React()

//   if (!chainId) return null
//   // confirmation screen
//   return (
//     <Modal isOpen={isOpen} $scrollOverlay={true} onDismiss={onDismiss} maxHeight={90}>
//       {isL2ChainId(chainId) && (hash || attemptingTxn) ? (
//         <L2Content chainId={chainId} hash={hash} onDismiss={onDismiss} pendingText={pendingText} />
//       ) : attemptingTxn ? (
//         <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
//       ) : hash ? (
//         <TransactionSubmittedContent
//           chainId={chainId}
//           hash={hash}
//           onDismiss={onDismiss}
//           currencyToAdd={currencyToAdd}
//         />
//       ) : (
//         content()
//       )}
//       {setIsLoadingQuote&& (<SmallButtonPrimary 
//            onClick={() => setIsLoadingQuote(!isLoadingQuote)} 
//       >
//         <Trans>Refresh Quote</Trans>
//       </SmallButtonPrimary>)}
//     </Modal>
//   )
// }