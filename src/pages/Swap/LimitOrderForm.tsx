import { InterfaceSectionName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Price, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import TradePrice from 'components/swap/TradePrice'
import { nativeOnChain } from 'constants/tokens'
import useDebounce from 'hooks/useDebounce'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo, useState } from 'react'
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
      needsWrap,
      swapper,
      deadlineBufferSecs: TWENTY_MINUTES_IN_S,
    })
  }, [inputToken, outputToken, parsedAmountIn, parsedAmountOut, swapper])
}

export function LimitOrderForm() {
  const { account } = useWeb3React()
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
    </Container>
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
