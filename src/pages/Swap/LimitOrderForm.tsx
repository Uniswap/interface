import { Trans } from '@lingui/macro'
import { InterfaceSectionName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { ButtonError, ButtonLight } from 'components/Button'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import TradePrice from 'components/swap/TradePrice'
import { nativeOnChain } from 'constants/tokens'
import useDebounce from 'hooks/useDebounce'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { LimitOrderTrade, RouterPreference, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { LimitOrderExpiry, LimitOrderExpiryDropdown } from './LimitOrderExpiryDropdown'

// only exact-in for now
// TODO: generalize this form for exact in vs exact out
type LimitOrderFormState = {
  inputToken?: Currency
  outputToken?: Currency
  inputAmount: string // what the user types
  outputAmount: string // what the user types
  expiry: LimitOrderExpiry
}

// only works on mainnet for now
const DEFAULT_STATE = {
  inputToken: nativeOnChain(1),
  outputToken: undefined,
  inputAmount: '',
  outputAmount: '',
  expiry: LimitOrderExpiry.OneHour,
}

const TWENTY_MINUTES_IN_S = 20 * 60

function useLimitOrderTrade(
  state: LimitOrderFormState,
  parsedAmountIn?: CurrencyAmount<Currency>,
  parsedAmountOut?: CurrencyAmount<Currency>,
  swapper?: string
) {
  const { inputToken, outputToken } = state
  return useMemo(() => {
    if (!inputToken || !outputToken || !parsedAmountIn || !parsedAmountOut || !swapper) return undefined

    const [currencyIn, needsWrap] = inputToken.isNative ? [inputToken.wrapped, true] : [inputToken, false]

    const amountIn = CurrencyAmount.fromRawAmount(currencyIn, parsedAmountIn.quotient)
    return new LimitOrderTrade({
      currencyIn,
      currencyOut: outputToken,
      amountIn,
      amountOut: parsedAmountOut,
      tradeType: TradeType.EXACT_INPUT,
      wrapInfo: { needsWrap, wrapGasEstimateUSD: 0 },
      approveInfo: { needsApprove: false },
      swapper,
      deadlineBufferSecs: TWENTY_MINUTES_IN_S,
    })
  }, [inputToken, outputToken, parsedAmountIn, parsedAmountOut, swapper])
}

export function LimitOrderForm() {
  const { account } = useWeb3React()
  // const [showConfirm, setShowConfirm] = useState(false)
  const [limitOrderState, setLimitOrder] = useState<LimitOrderFormState>(DEFAULT_STATE)

  const { inputToken, outputToken, inputAmount, outputAmount, expiry } = limitOrderState
  const userTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputToken, outputToken], [inputToken, outputToken])
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(userTokenBalances[0]),
    [userTokenBalances]
  )

  const setLimitOrderField = (field: string) => (newValue: any) =>
    setLimitOrder((prev) => ({
      ...prev,
      [field]: newValue,
    }))

  const onMax = () => setLimitOrderField('inputAmount')(maxInputAmount?.toExact())

  const parsedAmountIn = useMemo(() => tryParseCurrencyAmount(inputAmount, inputToken), [inputAmount, inputToken])
  const parsedAmountOut = useMemo(() => tryParseCurrencyAmount(outputAmount, outputToken), [outputAmount, outputToken])

  const fiatValueTradeInput = useUSDPrice(parsedAmountIn)
  const fiatValueTradeOutput = useUSDPrice(parsedAmountOut)

  const executionPrice = useMemo(() => {
    if (!parsedAmountIn || !parsedAmountOut) return

    return new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient
    )
  }, [parsedAmountIn, parsedAmountOut])

  const debouncedExecutionPrice = useDebounce(executionPrice, 500)

  // TODO: add token tax stuff
  const marketTrade = useRoutingAPITrade(
    false /* skipFetch */,
    // TODO: support exact out
    TradeType.EXACT_INPUT,
    parsedAmountIn,
    outputToken,
    RouterPreference.API,
    account
  )

  const { formatCurrencyAmount } = useFormatter()
  const formattedMarketOutputAmount =
    marketTrade?.state !== TradeState.LOADING && marketTrade?.trade
      ? formatCurrencyAmount({ amount: marketTrade.trade.outputAmount, type: NumberType.SwapTradeAmount })
      : '-'

  const showPriceWarning =
    marketTrade.state !== TradeState.LOADING && marketTrade?.trade && debouncedExecutionPrice
      ? marketTrade.trade.executionPrice.greaterThan(debouncedExecutionPrice)
      : false

  const theme = useTheme()
  const limitOrderTrade = useLimitOrderTrade(limitOrderState, parsedAmountIn, parsedAmountOut, account)
  const toggleWalletDrawer = useToggleAccountDrawer()

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapError, swapResult }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm?: LimitOrderTrade
    swapError?: Error
    swapResult?: SwapResult
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    swapError: undefined,
    swapResult: undefined,
  })

  const handleAcceptChanges = useCallback(() => {
    setSwapState((currentState) => ({ ...currentState, tradeToConfirm: limitOrderTrade }))
  }, [limitOrderTrade])

  const allowance = usePermit2Allowance(
    limitOrderTrade?.inputAmount,
    UNIVERSAL_ROUTER_ADDRESS(1),
    limitOrderTrade?.fillType
  )

  // the callback to execute the swap
  const swapCallback = useSwapCallback(
    limitOrderTrade,
    { amountIn: undefined, amountOut: undefined },
    new Percent(0, 1),
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    swapCallback()
      .then((result) => {
        setSwapState((currentState) => ({
          ...currentState,
          swapError: undefined,
          swapResult: result,
        }))
      })
      .catch((error) => {
        setSwapState((currentState) => ({
          ...currentState,
          swapError: error,
          swapResult: undefined,
        }))
      })
  }, [swapCallback])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((currentState) => ({ ...currentState, showConfirm: false }))
    // If there was a swap, we want to clear the input
    if (swapResult) {
      setLimitOrder(DEFAULT_STATE)
    }
  }, [swapResult])

  const handleContinueToReview = useCallback(() => {
    setSwapState({
      tradeToConfirm: limitOrderTrade,
      swapError: undefined,
      showConfirm: true,
      swapResult: undefined,
    })
  }, [limitOrderTrade])

  return (
    <Container>
      <SwapSection>
        <SwapCurrencyInputPanel
          label={`You're selling`}
          value={inputAmount}
          showMaxButton
          currency={inputToken}
          onUserInput={setLimitOrderField('inputAmount')}
          onMax={onMax}
          fiatValue={inputAmount ? fiatValueTradeInput : undefined}
          onCurrencySelect={setLimitOrderField('inputToken')}
          otherCurrency={outputToken}
          showCommonBases
          id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
        />
      </SwapSection>
      <SwapSection>
        <SwapCurrencyInputPanel
          label={`You're buying (Market quote: ${formattedMarketOutputAmount})`}
          value={outputAmount}
          currency={outputToken ?? null}
          showMaxButton={false}
          onUserInput={setLimitOrderField('outputAmount')}
          onCurrencySelect={setLimitOrderField('outputToken')}
          otherCurrency={inputToken}
          showCommonBases
          id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
        />
      </SwapSection>
      <Row>
        <PriceSection>
          <ThemedText.SubHeaderSmall>Your price</ThemedText.SubHeaderSmall>
          {executionPrice ? <TradePrice price={executionPrice} hideUSDPrice /> : '-'}
        </PriceSection>
        <LimitOrderExpiryDropdown selected={expiry} onSelect={setLimitOrderField('expiry')} />
      </Row>
      {showPriceWarning && (
        <Warning>
          <AlertTriangleFilled fill={theme.critical} />
          <ThemedText.BodySmall color={theme.critical}>Your order is below the market rate.</ThemedText.BodySmall>
        </Warning>
      )}
      <SubmitOrderButton
        handleContinueToReview={handleContinueToReview}
        trade={limitOrderTrade}
        toggleWalletDrawer={toggleWalletDrawer}
        account={account}
      />

      {limitOrderTrade && showConfirm && (
        <ConfirmSwapModal
          trade={limitOrderTrade}
          inputCurrency={inputToken}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          onCurrencySelection={(_, currency: Currency) => setLimitOrderField('inputToken')(currency)}
          swapResult={swapResult}
          allowedSlippage={new Percent(0, 100)}
          clearSwapState={() => setLimitOrder(DEFAULT_STATE)}
          onConfirm={handleSwap}
          allowance={allowance}
          swapError={swapError}
          onDismiss={handleConfirmDismiss}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
        />
      )}
    </Container>
  )
}

function SubmitOrderButton({
  trade,
  account,
  toggleWalletDrawer,
  handleContinueToReview,
}: {
  trade?: LimitOrderTrade
  account?: string
  toggleWalletDrawer: () => void
  handleContinueToReview: () => void
}) {
  if (!account) {
    return (
      <ButtonLight onClick={toggleWalletDrawer} fontWeight={535} $borderRadius="16px">
        <Trans>Connect wallet</Trans>
      </ButtonLight>
    )
  }

  return (
    <ButtonError
      onClick={handleContinueToReview}
      id="submit-order-button"
      data-testid="submit-order-button"
      disabled={!trade}
      // error={!swapInputError && priceImpactSeverity > 2 && allowance.state === AllowanceState.ALLOWED}
    >
      <Text fontSize={20}>Submit order</Text>
    </ButtonError>
  )
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 4px;
`

const Row = styled.div`
  display: flex;
  justify-content: stretch;
  gap: 4px;
`

const PriceSection = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  // height: 50px;
  line-height: 20px;
  padding: 16px;

  flex: 1;
`

const SwapSection = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  height: 120px;
  line-height: 20px;
  padding: 16px;
  position: relative;

  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.surface2};
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
  }
`

const OutputSwapSection = styled(SwapSection)`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface1}`};
`

const Warning = styled.div`
  border-radius: 16px;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.deprecated_accentFailureSoft};
  color: ${({ theme }) => theme.critical};

  display: flex;
  flex-flow: row;
  align-items: center;
  gap: 4px;
`
