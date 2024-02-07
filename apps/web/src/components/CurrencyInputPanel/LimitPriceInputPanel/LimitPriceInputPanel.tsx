import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { InputPanel } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { StyledNumericalInput } from 'components/NumericalInput'
import Row from 'components/Row'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useMemo } from 'react'
import { useLimitContext, useLimitPrice } from 'state/limit/LimitContext'
import { useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { formatCurrencySymbol } from '../utils'
import { LimitCustomMarketPriceButton, LimitPresetPriceButton } from './LimitPriceButton'
import { LimitPriceIncrementButtons } from './LimitPriceIncrementButtons'
import { LimitPriceInputLabel } from './LimitPriceInputLabel'

const OutputCurrencyContainer = styled(Row)`
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TextInputRow = styled.div`
  display: flex;
  flex-grow: 1;
`

const PRICE_ADJUSTMENT_PRESETS = [1, 5, 10]

export function LimitPriceInputPanel() {
  const { limitPrice, setLimitPrice } = useLimitPrice()
  const {
    derivedLimitInfo: { parsedLimitPrice, marketPrice },
    setLimitState,
  } = useLimitContext()

  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const { formatCurrencyAmount } = useFormatter()

  const oneUnitOfInputCurrency: CurrencyAmount<Currency> | undefined = useMemo(() => {
    if (!inputCurrency) return undefined
    return CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(parseUnits('1', inputCurrency?.decimals)))
  }, [inputCurrency])

  const formattedLimitPriceOutputAmount: string = useMemo(() => {
    // If the user has manually typed in a limit price, use that.
    if (limitPrice) return limitPrice
    // Otherwise, use parsedLimitPrice which may have been calculated from input/output amounts.
    if (!inputCurrency) return ''
    return formatCurrencyAmount({
      amount: parsedLimitPrice?.quote(CurrencyAmount.fromRawAmount(inputCurrency, 1)),
      type: NumberType.SwapTradeAmount,
      placeholder: '',
    })
  }, [limitPrice, inputCurrency, formatCurrencyAmount, parsedLimitPrice])

  const adjustedPrices = useMemo(() => {
    if (!marketPrice || !inputCurrency || !oneUnitOfInputCurrency || !outputCurrency) return undefined
    const getAdjustedPrice = (priceAdjustmentPercentage: number) => {
      return new Price({
        // 100 input token
        baseAmount: CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(parseUnits('100', inputCurrency.decimals))),
        // (100 + adjustmentPercentage) times the market quote amount for 1 input token
        quoteAmount: CurrencyAmount.fromRawAmount(
          outputCurrency,
          JSBI.multiply(
            JSBI.BigInt(100 + priceAdjustmentPercentage),
            marketPrice.quote(oneUnitOfInputCurrency).quotient
          )
        ),
      })
    }
    return {
      1: getAdjustedPrice(1),
      5: getAdjustedPrice(5),
      10: getAdjustedPrice(10),
    }
  }, [marketPrice, inputCurrency, oneUnitOfInputCurrency, outputCurrency])

  const onePercentOfMarketPrice: CurrencyAmount<Currency> | undefined = useMemo(() => {
    if (!marketPrice || !oneUnitOfInputCurrency || !outputCurrency) return undefined
    const marketQuote = marketPrice.quote(oneUnitOfInputCurrency).quotient
    return CurrencyAmount.fromRawAmount(outputCurrency, JSBI.divide(marketQuote, JSBI.BigInt(100)))
  }, [oneUnitOfInputCurrency, marketPrice, outputCurrency])

  const currentPriceAdjustment: number | undefined = useMemo(() => {
    if (!parsedLimitPrice || !marketPrice || !oneUnitOfInputCurrency || !outputCurrency) return undefined
    const marketQuote = marketPrice.quote(oneUnitOfInputCurrency).quotient
    const parsedPriceQuote = parsedLimitPrice.quote(oneUnitOfInputCurrency).quotient
    const difference = JSBI.subtract(parsedPriceQuote, marketQuote)
    const percentageChange = new Fraction(difference, marketQuote)

    return Number(percentageChange.multiply(100).toFixed(2))
  }, [oneUnitOfInputCurrency, outputCurrency, marketPrice, parsedLimitPrice])

  const onSelectLimitPrice = useCallback(
    (adjustedPrice: Price<Currency, Currency> | undefined) => {
      if (!oneUnitOfInputCurrency) return
      const marketOutputAmount = adjustedPrice?.quote(oneUnitOfInputCurrency)
      setLimitPrice(
        formatCurrencyAmount({
          amount: marketOutputAmount,
          type: NumberType.SwapTradeAmount,
          placeholder: limitPrice,
        })
      )
      setLimitState((prev) => ({ ...prev, limitPriceEdited: true }))
    },
    [formatCurrencyAmount, limitPrice, oneUnitOfInputCurrency, setLimitPrice, setLimitState]
  )

  return (
    <InputPanel>
      <LimitPriceInputLabel currency={inputCurrency} showCurrencyMessage={!!formattedLimitPriceOutputAmount} />
      <TextInputRow>
        <StyledNumericalInput
          disabled={!(inputCurrency && outputCurrency)}
          className="limit-price-input"
          value={formattedLimitPriceOutputAmount}
          onUserInput={setLimitPrice}
          $loading={false}
        />
        {outputCurrency && (
          <OutputCurrencyContainer gap="xs" width="unset">
            <CurrencyLogo currency={outputCurrency} size="16px" />
            <ThemedText.BodyPrimary className="token-symbol-container">
              {formatCurrencySymbol(outputCurrency)}
            </ThemedText.BodyPrimary>
          </OutputCurrencyContainer>
        )}
      </TextInputRow>
      <Row marginTop="8px" justify="space-between">
        <Row gap="sm">
          <LimitCustomMarketPriceButton
            key="limit-price-market"
            customAdjustmentPercentage={
              currentPriceAdjustment !== undefined &&
              currentPriceAdjustment !== 0 &&
              !PRICE_ADJUSTMENT_PRESETS.includes(currentPriceAdjustment)
                ? currentPriceAdjustment
                : undefined
            }
            disabled={!inputCurrency || !outputCurrency}
            selected={Boolean(
              currentPriceAdjustment !== undefined && !PRICE_ADJUSTMENT_PRESETS.includes(currentPriceAdjustment)
            )}
            onSelect={() => onSelectLimitPrice(marketPrice)}
          />
          {PRICE_ADJUSTMENT_PRESETS.map((adjustmentPercentage) => {
            const adjustedPrice = adjustedPrices?.[adjustmentPercentage as keyof typeof adjustedPrices]
            return (
              <LimitPresetPriceButton
                key={`limit-price-${adjustmentPercentage}`}
                priceAdjustmentPercentage={adjustmentPercentage}
                disabled={!inputCurrency || !outputCurrency || !marketPrice}
                // TODO (WEB-3416): give this equality check some small +- threshold
                selected={currentPriceAdjustment === adjustmentPercentage}
                onSelect={() => onSelectLimitPrice(adjustedPrice)}
              />
            )
          })}
        </Row>
        {parsedLimitPrice && onePercentOfMarketPrice && oneUnitOfInputCurrency && (
          <LimitPriceIncrementButtons
            onIncrement={() => {
              setLimitPrice(
                formatCurrencyAmount({
                  amount: parsedLimitPrice?.quote(oneUnitOfInputCurrency).add(onePercentOfMarketPrice),
                  type: NumberType.SwapTradeAmount,
                  placeholder: limitPrice,
                })
              )
            }}
            onDecrement={() => {
              setLimitPrice(
                formatCurrencyAmount({
                  amount: parsedLimitPrice?.quote(oneUnitOfInputCurrency).subtract(onePercentOfMarketPrice),
                  type: NumberType.SwapTradeAmount,
                  placeholder: limitPrice,
                })
              )
            }}
          />
        )}
      </Row>
    </InputPanel>
  )
}
