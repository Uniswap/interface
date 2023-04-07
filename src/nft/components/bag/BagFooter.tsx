import { BigNumber } from '@ethersproject/bignumber'
import { formatEther, parseEther } from '@ethersproject/units'
import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { SupportedChainId } from 'constants/chains'
import { usePayWithAnyTokenEnabled } from 'featureFlags/flags/payWithAnyToken'
import { useCurrency } from 'hooks/Tokens'
import { AllowanceState } from 'hooks/usePermit2Allowance'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useBag } from 'nft/hooks/useBag'
import { useBagTotalEthPrice } from 'nft/hooks/useBagTotalEthPrice'
import useDerivedPayWithAnyTokenSwapInfo from 'nft/hooks/useDerivedPayWithAnyTokenSwapInfo'
import { useFetchAssets } from 'nft/hooks/useFetchAssets'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import usePermit2Approval from 'nft/hooks/usePermit2Approval'
import { PriceImpact, usePriceImpact } from 'nft/hooks/usePriceImpact'
import { useSubscribeTransactionState } from 'nft/hooks/useSubscribeTransactionState'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { useWalletBalance } from 'nft/hooks/useWalletBalance'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'
import { shallow } from 'zustand/shallow'

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

const FooterHeader = styled(Column)<{ usingPayWithAnyToken?: boolean }>`
  padding-top: 8px;
  padding-bottom: ${({ usingPayWithAnyToken }) => (usingPayWithAnyToken ? '16px' : '20px')};
`

const CurrencyRow = styled(Row)`
  justify-content: space-between;
  align-items: start;
  gap: 8px;
`

const TotalColumn = styled(Column)`
  text-align: end;
  overflow-x: hidden;
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: inherit;
`
const WarningText = styled(ThemedText.BodyPrimary)<{ $color: string }>`
  align-items: center;
  color: ${({ $color }) => $color};
  display: flex;
  justify-content: center;
  margin-bottom: 10px !important;
  text-align: center;
`

const HelperText = styled(ThemedText.Caption)<{ $color: string }>`
  color: ${({ $color }) => $color};
  display: flex;
  justify-content: center;
  text-align: center;
  margin-bottom: 10px !important;
`

const CurrencyInput = styled(Row)`
  gap: 8px;
  cursor: pointer;
`

const PayButton = styled.button<{ $backgroundColor: string; $color: string }>`
  display: flex;
  background: ${({ $backgroundColor }) => $backgroundColor};
  color: ${({ $color }) => $color};
  font-weight: 600;
  line-height: 24px;
  font-size: 16px;
  gap: 16px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 12px 0px;
  cursor: pointer;
  align-items: center;

  &:disabled {
    opacity: 0.6;
    cursor: auto;
  }
`
const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 20px;
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

const ValueText = styled(ThemedText.BodyPrimary)`
  line-height: 20px;
  font-weight: 500;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  scrollbar-width: none;

  ::-webkit-scrollbar {
    display: none;
  }
`

interface ActionButtonProps {
  disabled?: boolean
  onClick: () => void
  backgroundColor: string
  textColor: string
}

const ActionButton = ({
  disabled,
  children,
  onClick,
  backgroundColor,
  textColor,
}: PropsWithChildren<ActionButtonProps>) => {
  return (
    <PayButton disabled={disabled} onClick={onClick} $backgroundColor={backgroundColor} $color={textColor}>
      {children}
    </PayButton>
  )
}

interface HelperTextProps {
  color: string
}

const Warning = ({ color, children }: PropsWithChildren<HelperTextProps>) => {
  if (!children) {
    return null
  }
  return (
    <WarningText fontSize="14px" lineHeight="20px" $color={color}>
      <WarningIcon />
      {children}
    </WarningText>
  )
}

const Helper = ({ children, color }: PropsWithChildren<HelperTextProps>) => {
  if (!children) {
    return null
  }
  return (
    <HelperText lineHeight="16px" $color={color}>
      {children}
    </HelperText>
  )
}

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

  if (tradeState === TradeState.LOADING) {
    return (
      <ThemedText.BodyPrimary color="textTertiary" lineHeight="20px" fontWeight="500">
        <Trans>Fetching price...</Trans>
      </ThemedText.BodyPrimary>
    )
  }

  return (
    <ValueText color={tradeState === TradeState.SYNCING ? 'textTertiary' : 'textPrimary'}>
      {ethNumberStandardFormatter(trade?.inputAmount.toExact())}
    </ValueText>
  )
}

const FiatValue = ({
  usdcValue,
  priceImpact,
  tradeState,
  usingPayWithAnyToken,
}: {
  usdcValue: CurrencyAmount<Token> | null
  priceImpact: PriceImpact | undefined
  tradeState: TradeState
  usingPayWithAnyToken: boolean
}) => {
  if (!usdcValue) {
    if (usingPayWithAnyToken && (tradeState === TradeState.INVALID || tradeState === TradeState.NO_ROUTE_FOUND)) {
      return null
    }

    return <FiatLoadingBubble />
  }

  return (
    <PriceImpactContainer>
      {priceImpact && (
        <>
          <MouseoverTooltip text={t`The estimated difference between the USD values of input and output amounts.`}>
            <PriceImpactRow>
              <AlertTriangle color={priceImpact.priceImpactSeverity.color} size="16px" />
              <ThemedText.BodySmall style={{ color: priceImpact.priceImpactSeverity.color }} lineHeight="20px">
                (<Trans>{priceImpact.displayPercentage()}</Trans>)
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
  setModalIsOpen: (open: boolean) => void
  eventProperties: Record<string, unknown>
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

export const BagFooter = ({ setModalIsOpen, eventProperties }: BagFooterProps) => {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const theme = useTheme()
  const { account, chainId, connector } = useWeb3React()
  const connected = Boolean(account && chainId)
  const totalEthPrice = useBagTotalEthPrice()
  const shouldUsePayWithAnyToken = usePayWithAnyTokenEnabled()
  const inputCurrency = useTokenInput((state) => state.inputCurrency)
  const setInputCurrency = useTokenInput((state) => state.setInputCurrency)
  const defaultCurrency = useCurrency('ETH')
  const inputCurrencyBalance = useTokenBalance(
    account ?? undefined,
    !!inputCurrency && inputCurrency.isToken ? inputCurrency : undefined
  )
  const {
    isLocked: bagIsLocked,
    bagStatus,
    setBagExpanded,
    setBagStatus,
  } = useBag(
    ({ isLocked, bagStatus, setBagExpanded, setBagStatus }) => ({
      isLocked,
      bagStatus,
      setBagExpanded,
      setBagStatus,
    }),
    shallow
  )
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const isPending = PENDING_BAG_STATUSES.includes(bagStatus)
  const activeCurrency = inputCurrency ?? defaultCurrency
  const usingPayWithAnyToken = !!inputCurrency && shouldUsePayWithAnyToken && chainId === SupportedChainId.MAINNET

  useSubscribeTransactionState(setModalIsOpen)
  const fetchAssets = useFetchAssets()

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])
  const {
    state: tradeState,
    trade,
    maximumAmountIn,
    allowedSlippage,
  } = useDerivedPayWithAnyTokenSwapInfo(usingPayWithAnyToken ? inputCurrency : undefined, parsedOutputAmount)
  const { allowance, isAllowancePending, isApprovalLoading, updateAllowance } = usePermit2Approval(
    trade?.inputAmount.currency.isToken ? (trade?.inputAmount as CurrencyAmount<Token>) : undefined,
    maximumAmountIn,
    shouldUsePayWithAnyToken
  )
  usePayWithAnyTokenSwap(trade, allowance, allowedSlippage)
  const priceImpact = usePriceImpact(trade)

  const fiatValueTradeInput = useStablecoinValue(trade?.inputAmount)
  const fiatValueTradeOutput = useStablecoinValue(parsedOutputAmount)
  const usdcValue = usingPayWithAnyToken ? fiatValueTradeInput : fiatValueTradeOutput

  const { balance: balanceInEth } = useWalletBalance()
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined
    }

    if (inputCurrency) {
      const inputAmount = trade?.inputAmount

      if (!inputCurrencyBalance || !inputAmount) {
        return undefined
      }

      return !inputCurrencyBalance.lessThan(inputAmount)
    }

    return parseEther(balanceInEth).gte(totalEthPrice)
  }, [connected, chainId, inputCurrency, balanceInEth, totalEthPrice, trade?.inputAmount, inputCurrencyBalance])

  useEffect(() => {
    setBagStatus(BagStatus.ADDING_TO_BAG)
  }, [inputCurrency, setBagStatus])

  const {
    buttonText,
    buttonTextColor,
    disabled,
    warningText,
    warningTextColor,
    helperText,
    helperTextColor,
    handleClick,
    buttonColor,
  } = useMemo(() => {
    let handleClick: (() => void) | (() => Promise<void>) = fetchAssets
    let buttonText = <Trans>Something went wrong</Trans>
    let disabled = true
    let warningText = undefined
    let warningTextColor = theme.accentWarning
    let helperText = undefined
    let helperTextColor = theme.textSecondary
    let buttonColor = theme.accentAction
    let buttonTextColor = theme.accentTextLightPrimary

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
        toggleWalletDrawer()
        setBagExpanded({ bagExpanded: false })
      }
      disabled = false
      buttonText = <Trans>Connect wallet</Trans>
    } else if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
      disabled = true
      buttonText = <Trans>Proceed in wallet</Trans>
    } else if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      disabled = true
      buttonText = <Trans>Transaction pending</Trans>
    } else if (usingPayWithAnyToken && tradeState !== TradeState.VALID) {
      disabled = true
      buttonText = <Trans>Fetching Route</Trans>

      if (tradeState === TradeState.INVALID) {
        buttonText = <Trans>Pay</Trans>
      }

      if (tradeState === TradeState.NO_ROUTE_FOUND) {
        buttonText = <Trans>Insufficient liquidity</Trans>
        buttonColor = theme.backgroundInteractive
        buttonTextColor = theme.textPrimary
        helperText = <Trans>Insufficient pool liquidity to complete transaction</Trans>
      }
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
    } else if (bagStatus === BagStatus.CONFIRM_QUOTE) {
      disabled = false
      warningTextColor = theme.accentAction
      warningText = <Trans>Price updated</Trans>
      buttonText = <Trans>Pay</Trans>
    } else if (priceImpact && priceImpact.priceImpactSeverity.type === 'error') {
      disabled = false
      buttonColor = priceImpact.priceImpactSeverity.color
      helperText = <Trans>Price impact warning</Trans>
      helperTextColor = priceImpact.priceImpactSeverity.color
      buttonText = <Trans>Pay Anyway</Trans>
    } else if (sufficientBalance === true) {
      disabled = false
      buttonText = <Trans>Pay</Trans>
      helperText = usingPayWithAnyToken ? <Trans>Refunds for unavailable items will be given in ETH</Trans> : undefined
    }

    return {
      buttonText,
      buttonTextColor,
      disabled,
      warningText,
      warningTextColor,
      helperText,
      helperTextColor,
      handleClick,
      buttonColor,
    }
  }, [
    fetchAssets,
    theme.accentWarning,
    theme.textSecondary,
    theme.accentAction,
    theme.accentTextLightPrimary,
    theme.backgroundInteractive,
    theme.textPrimary,
    connected,
    chainId,
    sufficientBalance,
    bagStatus,
    usingPayWithAnyToken,
    tradeState,
    allowance.state,
    priceImpact,
    connector,
    toggleWalletDrawer,
    setBagExpanded,
    isAllowancePending,
    isApprovalLoading,
    updateAllowance,
  ])

  const traceEventProperties = {
    usd_value: usdcValue?.toExact(),
    using_erc20: !!inputCurrency,
    ...eventProperties,
  }

  return (
    <FooterContainer>
      <Footer>
        {shouldUsePayWithAnyToken && (
          <FooterHeader gap="xs" usingPayWithAnyToken={shouldUsePayWithAnyToken}>
            <CurrencyRow>
              <Column gap="xs">
                <ThemedText.SubHeaderSmall>
                  <Trans>Pay with</Trans>
                </ThemedText.SubHeaderSmall>
                <CurrencyInput
                  onClick={() => {
                    if (!bagIsLocked) {
                      setTokenSelectorOpen(true)
                      sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTOR_CLICKED)
                    }
                  }}
                >
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
            <FiatValue
              usdcValue={usdcValue}
              priceImpact={priceImpact}
              tradeState={tradeState}
              usingPayWithAnyToken={usingPayWithAnyToken}
            />
          </FooterHeader>
        )}
        {!shouldUsePayWithAnyToken && (
          <FooterHeader gap="xs">
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
            <FiatValue
              usdcValue={usdcValue}
              priceImpact={priceImpact}
              tradeState={tradeState}
              usingPayWithAnyToken={usingPayWithAnyToken}
            />
          </FooterHeader>
        )}
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={{ ...traceEventProperties }}
          shouldLogImpression={connected && !disabled}
        >
          <Warning color={warningTextColor}>{warningText}</Warning>
          <Helper color={helperTextColor}>{helperText}</Helper>
          <ActionButton
            onClick={handleClick}
            disabled={disabled || isPending}
            backgroundColor={buttonColor}
            textColor={buttonTextColor}
          >
            {isPending && <Loader size="20px" stroke="white" />}
            {buttonText}
          </ActionButton>
        </TraceEvent>
      </Footer>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={(currency: Currency) => {
          setInputCurrency(currency.isNative ? undefined : currency)
          if (currency.isToken) {
            sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTED, {
              token_address: currency.address,
              token_symbol: currency.symbol,
            })
          }
        }}
        selectedCurrency={activeCurrency ?? undefined}
        onlyShowCurrenciesWithBalance={true}
      />
    </FooterContainer>
  )
}
