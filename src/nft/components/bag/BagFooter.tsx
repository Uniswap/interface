import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { parseEther } from '@ethersproject/units'
import { t, Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { formatPriceImpact } from '@uniswap/conedison/format'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import Loader from 'components/Loader'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { SupportedChainId } from 'constants/chains'
import { PayWithAnyTokenVariant, usePayWithAnyTokenFlag } from 'featureFlags/flags/payWithAnyToken'
import { useCurrency } from 'hooks/Tokens'
import { AllowanceState } from 'hooks/usePermit2Allowance'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useBag } from 'nft/hooks/useBag'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import usePermit2Approval from 'nft/hooks/usePermit2Approval'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { useWalletBalance } from 'nft/hooks/useWalletBalance'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { PropsWithChildren, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { useToggleWalletModal } from 'state/application/hooks'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { warningSeverity } from 'utils/prices'
import { switchChain } from 'utils/switchChain'

enum PriceImpactWarnings {
  LOW,
  SEVERE,
}

const FooterContainer = styled.div`
  padding: 0px 12px;
`

const Footer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  margin: 0px 16px 8px;
  padding: 12px 0px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
`

const FooterHeader = styled(Column)<{ warningText?: boolean; usingPayWithAnyToken?: boolean }>`
  padding-top: 8px;
  padding-bottom: ${({ warningText, usingPayWithAnyToken }) =>
    warningText ? (usingPayWithAnyToken ? '16px' : '8px') : usingPayWithAnyToken ? '16px' : '20px'};
`

const CurrencyRow = styled(Row)`
  justify-content: space-between;
  align-items: start;
`

const TotalColumn = styled(Column)`
  text-align: end;
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentWarning};
`
const WarningText = styled(ThemedText.BodyPrimary)`
  align-items: center;
  color: ${({ theme }) => theme.accentWarning};
  display: flex;
  justify-content: center;
  margin-bottom: 10px !important;
  text-align: center;
`

const HelperText = styled(ThemedText.Caption)`
  align-items: center;
  display: flex;
  justify-content: center;
  text-align: center;
  margin-bottom: 10px !important;
`

const CurrencyInput = styled(Row)`
  gap: 8px;
  cursor: pointer;
`

const PayButton = styled(Row)<{ disabled?: boolean }>`
  background: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.accentTextLightPrimary};
  font-weight: 600;
  line-height: 24px;
  font-size: 16px;
  gap: 16px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 12px 0px;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
`
const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 1rem;
  align-self: end;
`
const PriceImpactContainer = styled(Row)`
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`

const PriceImpactRow = styled(Row)`
  align-items: center;
  gap: 8px;
`

interface ActionButtonProps {
  disabled?: boolean
  onClick: () => void
}

const ActionButton = ({ disabled, children, onClick }: PropsWithChildren<ActionButtonProps>) => {
  return (
    <PayButton disabled={disabled} onClick={onClick}>
      {children}
    </PayButton>
  )
}

const Warning = ({ children }: PropsWithChildren<unknown>) => {
  if (!children) {
    return null
  }
  return (
    <WarningText fontSize="14px" lineHeight="20px">
      <WarningIcon />
      {children}
    </WarningText>
  )
}

const Helper = ({ children }: PropsWithChildren<unknown>) => {
  if (!children) {
    return null
  }
  return (
    <HelperText lineHeight="16px" color="textSecondary">
      {children}
    </HelperText>
  )
}

// TODO: ask design about no route found
const InputCurrencyValue = ({
  usingPayWithAnyToken,
  totalEthPrice,
  activeCurrency,
  tradeState,
  trade,
}: {
  usingPayWithAnyToken: boolean
  totalEthPrice: BigNumber
  activeCurrency: Currency | undefined | null
  tradeState: TradeState
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
}) => {
  if (!usingPayWithAnyToken) {
    return (
      <ThemedText.BodyPrimary lineHeight="20px" fontWeight="500">
        {formatWeiToDecimal(totalEthPrice.toString())}
        &nbsp;{activeCurrency?.symbol ?? 'ETH'}
      </ThemedText.BodyPrimary>
    )
  }

  if (tradeState === TradeState.VALID || tradeState === TradeState.SYNCING) {
    return (
      <ThemedText.BodyPrimary
        lineHeight="20px"
        fontWeight="500"
        color={tradeState === TradeState.VALID ? 'textPrimary' : 'textTertiary'}
      >
        {ethNumberStandardFormatter(trade?.inputAmount.toExact())}
      </ThemedText.BodyPrimary>
    )
  }

  return (
    <ThemedText.BodyPrimary color="textTertiary" lineHeight="20px" fontWeight="500">
      Fetching price...
    </ThemedText.BodyPrimary>
  )
}

const FiatValue = ({
  usdcValue,
  priceImpact,
}: {
  usdcValue: CurrencyAmount<Token> | null
  priceImpact: Percent | undefined
}) => {
  const theme = useTheme()

  const priceImpactColor = useMemo(() => {
    if (!priceImpact) {
      return undefined
    }

    const severity = warningSeverity(priceImpact)
    if (severity < 1) {
      return undefined
    }

    if (severity < 3) {
      return theme.accentWarning
    }

    return theme.accentCritical
  }, [priceImpact, theme.accentCritical, theme.accentWarning])

  if (!usdcValue) {
    return <FiatLoadingBubble />
  }

  return (
    <PriceImpactContainer>
      {priceImpact && priceImpactColor && (
        <>
          <MouseoverTooltip text={t`The estimated difference between the USD values of input and output amounts.`}>
            <PriceImpactRow>
              <AlertTriangle color={priceImpactColor} size="16px" />
              <ThemedText.BodySmall style={{ color: priceImpactColor }} lineHeight="20px">
                (<Trans>{formatPriceImpact(priceImpact)}</Trans>)
              </ThemedText.BodySmall>
            </PriceImpactRow>
          </MouseoverTooltip>
        </>
      )}
      <ThemedText.BodySmall color="textTertiary" lineHeight="20px">
        {`${ethNumberStandardFormatter(usdcValue?.toExact(), true)}`}
      </ThemedText.BodySmall>
    </PriceImpactContainer>
  )
}

interface BagFooterProps {
  totalEthPrice: BigNumber
  bagStatus: BagStatus
  fetchAssets: () => void
  eventProperties: Record<string, unknown>
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({ totalEthPrice, bagStatus, fetchAssets, eventProperties }: BagFooterProps) => {
  const toggleWalletModal = useToggleWalletModal()
  const theme = useTheme()
  const { account, chainId, connector } = useWeb3React()
  const connected = Boolean(account && chainId)
  const shouldUsePayWithAnyToken = usePayWithAnyTokenFlag() === PayWithAnyTokenVariant.Enabled
  const inputCurrency = useTokenInput((state) => state.inputCurrency)
  const setInputCurrency = useTokenInput((state) => state.setInputCurrency)
  const defaultCurrency = useCurrency('ETH')

  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)

  const { balance: balanceInEth } = useWalletBalance()
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined
    }
    return parseEther(balanceInEth).gte(totalEthPrice)
  }, [connected, chainId, balanceInEth, totalEthPrice])

  const isPending = PENDING_BAG_STATUSES.includes(bagStatus)
  const activeCurrency = inputCurrency ?? defaultCurrency
  const usingPayWithAnyToken = !!inputCurrency && shouldUsePayWithAnyToken

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])
  const { state: tradeState, trade, maximumAmountIn } = usePayWithAnyTokenSwap(inputCurrency, parsedOutputAmount)
  const { allowance, isAllowancePending, isApprovalLoading, updateAllowance } = usePermit2Approval(
    trade?.inputAmount.currency.isToken ? (trade?.inputAmount as CurrencyAmount<Token>) : undefined,
    maximumAmountIn
  )

  const fiatValueTradeInput = useStablecoinValue(trade?.inputAmount)
  const fiatValueTradeOutput = useStablecoinValue(parsedOutputAmount)
  const usdcValue = usingPayWithAnyToken ? fiatValueTradeInput : fiatValueTradeOutput
  const stablecoinPriceImpact = useMemo(
    () =>
      tradeState === TradeState.SYNCING || !trade
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput, fiatValueTradeOutput),
    [fiatValueTradeInput, fiatValueTradeOutput, tradeState, trade]
  )

  const { buttonText, disabled, warningText, helperText, handleClick } = useMemo(() => {
    let handleClick = fetchAssets
    let buttonText = <Trans>Something went wrong</Trans>
    let disabled = true
    let warningText = undefined
    let helperText = undefined

    if (connected && chainId !== SupportedChainId.MAINNET) {
      handleClick = () => switchChain(connector, SupportedChainId.MAINNET)
      buttonText = <Trans>Switch networks</Trans>
      disabled = false
      warningText = <Trans>Wrong network</Trans>
    } else if (sufficientBalance === false) {
      buttonText = <Trans>Pay</Trans>
      disabled = true
      warningText = <Trans>Insufficient funds</Trans>
    } else if (bagStatus === BagStatus.WARNING) {
      warningText = <Trans>Something went wrong. Please try again.</Trans>
    } else if (!connected) {
      handleClick = () => {
        toggleWalletModal()
        setBagExpanded({ bagExpanded: false })
      }
      disabled = false
      buttonText = <Trans>Connect wallet</Trans>
    } else if (usingPayWithAnyToken && tradeState !== TradeState.VALID) {
      disabled = true
      buttonText = <Trans>Fetching Route</Trans>
    } else if (allowance.state === AllowanceState.REQUIRED || allowance.state === AllowanceState.LOADING) {
      handleClick = () => updateAllowance()
      disabled = isAllowancePending || isApprovalLoading || allowance.state === AllowanceState.LOADING

      if (allowance.state === AllowanceState.LOADING) {
        buttonText = <Trans>Loading Allowance</Trans>
      } else if (isAllowancePending) {
        buttonText = <Trans>Approve in your wallet</Trans>
      } else if (isApprovalLoading) {
        buttonText = <Trans>Approval pending</Trans>
      } else {
        helperText = <Trans>An approval is needed to use this token. </Trans>
        buttonText = <Trans>Approve</Trans>
      }
    } else if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
      disabled = true
      buttonText = <Trans>Proceed in wallet</Trans>
    } else if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      disabled = true
      buttonText = <Trans>Transaction pending</Trans>
    } else if (sufficientBalance === true) {
      disabled = false
      buttonText = <Trans>Pay</Trans>
    }

    return { buttonText, disabled, warningText, helperText, handleClick }
  }, [
    fetchAssets,
    connected,
    chainId,
    sufficientBalance,
    bagStatus,
    usingPayWithAnyToken,
    tradeState,
    allowance.state,
    connector,
    toggleWalletModal,
    setBagExpanded,
    isAllowancePending,
    isApprovalLoading,
    updateAllowance,
  ])

  const traceEventProperties = {
    usd_value: usdcValue?.toExact(),
    ...eventProperties,
  }

  return (
    <FooterContainer>
      <Footer>
        {shouldUsePayWithAnyToken && (
          <FooterHeader
            gap="xs"
            warningText={!!warningText || !!helperText}
            usingPayWithAnyToken={shouldUsePayWithAnyToken}
          >
            <CurrencyRow>
              <Column gap="xs">
                <ThemedText.SubHeaderSmall>
                  <Trans>Pay with</Trans>
                </ThemedText.SubHeaderSmall>
                <CurrencyInput onClick={() => setTokenSelectorOpen(true)}>
                  <CurrencyLogo currency={activeCurrency} size="24px" />
                  <ThemedText.HeadlineSmall fontWeight={500} lineHeight="24px">
                    {activeCurrency?.symbol}
                  </ThemedText.HeadlineSmall>
                  <ChevronDown size={20} color={theme.textSecondary} />
                </CurrencyInput>
              </Column>
              <TotalColumn gap="xs">
                <ThemedText.SubHeaderSmall marginBottom="4px">
                  <Trans>Total</Trans>
                </ThemedText.SubHeaderSmall>
                <InputCurrencyValue
                  usingPayWithAnyToken={usingPayWithAnyToken}
                  totalEthPrice={totalEthPrice}
                  activeCurrency={activeCurrency}
                  tradeState={tradeState}
                  trade={trade}
                />
              </TotalColumn>
            </CurrencyRow>
            <FiatValue usdcValue={usdcValue} priceImpact={stablecoinPriceImpact} />
          </FooterHeader>
        )}
        {!shouldUsePayWithAnyToken && (
          <FooterHeader gap="xs" warningText={!!warningText || !!helperText}>
            <Row justify="space-between">
              <div>
                <ThemedText.HeadlineSmall>Total</ThemedText.HeadlineSmall>
              </div>
              <div>
                <ThemedText.HeadlineSmall>
                  {formatWeiToDecimal(totalEthPrice.toString())}
                  &nbsp;{activeCurrency?.symbol ?? 'ETH'}
                </ThemedText.HeadlineSmall>
              </div>
            </Row>
            <FiatValue usdcValue={usdcValue} priceImpact={stablecoinPriceImpact} />
          </FooterHeader>
        )}
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={{ ...traceEventProperties }}
          shouldLogImpression={connected && !disabled}
        >
          <Warning>{warningText}</Warning>
          <Helper>{helperText}</Helper>
          <ActionButton onClick={handleClick} disabled={disabled}>
            {isPending && <Loader size="20px" stroke="white" />}
            {buttonText}
          </ActionButton>
        </TraceEvent>
      </Footer>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={(currency: Currency) => setInputCurrency(currency.isNative ? undefined : currency)}
        selectedCurrency={activeCurrency ?? undefined}
        onlyShowCurrenciesWithBalance={true}
      />
    </FooterContainer>
  )
}
