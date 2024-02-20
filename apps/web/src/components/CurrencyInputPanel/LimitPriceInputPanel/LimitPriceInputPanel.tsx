import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { InputPanel } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { StyledNumericalInput } from 'components/NumericalInput'
import Row from 'components/Row'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useMemo, useState } from 'react'
import { useLimitContext, useLimitPrice } from 'state/limit/LimitContext'
import { useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import PrefetchBalancesWrapper from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { ReversedArrowsIcon } from 'nft/components/icons'
import { LIMIT_FORM_CURRENCY_SEARCH_FILTERS } from 'pages/Swap/Limit/LimitForm'
import { formatCurrencySymbol } from '../utils'
import { LimitCustomMarketPriceButton, LimitPresetPriceButton } from './LimitPriceButton'
import { LimitPriceInputLabel } from './LimitPriceInputLabel'

const ReverseIconContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  ${ClickableStyle}
`

const OutputCurrencyContainer = styled(PrefetchBalancesWrapper)`
  display: flex;
  align-items: center;
`

const OutputCurrencyButton = styled.button`
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: transparent;
  border: none;
  display: flex;
  ${ClickableStyle}
`

const TextInputRow = styled.div`
  display: flex;
  flex-grow: 1;
`

const PRICE_ADJUSTMENT_PRESETS = [1, 5, 10]

interface LimitPriceInputPanelProps {
  onCurrencySelect: (newCurrency: Currency) => void
}

export function LimitPriceInputPanel({ onCurrencySelect }: LimitPriceInputPanelProps) {
  const [currencySelectModalOpen, setCurrencySelectModalOpen] = useState(false)
  const { limitPrice, setLimitPrice, limitPriceInverted } = useLimitPrice()
  const {
    derivedLimitInfo: { parsedLimitPrice, marketPrice: tradeMarketPrice },
    setLimitState,
  } = useLimitContext()

  const {
    currencyState: { inputCurrency: tradeInputCurrency, outputCurrency: tradeOutputCurrency },
  } = useSwapAndLimitContext()

  const [inputCurrency, outputCurrency, marketPrice] = limitPriceInverted
    ? [tradeOutputCurrency, tradeInputCurrency, tradeMarketPrice?.invert()]
    : [tradeInputCurrency, tradeOutputCurrency, tradeMarketPrice]

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

  const currentPriceAdjustment: number | undefined = useMemo(() => {
    if (!parsedLimitPrice || !marketPrice || !oneUnitOfInputCurrency || !outputCurrency) return undefined
    const marketQuote = marketPrice.quote(oneUnitOfInputCurrency).quotient
    const parsedPriceQuote = parsedLimitPrice.quote(oneUnitOfInputCurrency).quotient
    const difference = JSBI.subtract(parsedPriceQuote, marketQuote)
    const percentageChange = new Fraction(difference, marketQuote)

    return Math.floor(Number(percentageChange.multiply(100).toFixed(2)))
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
      <Row justify="space-between">
        <LimitPriceInputLabel currency={inputCurrency} showCurrencyMessage={!!formattedLimitPriceOutputAmount} />
        <ReverseIconContainer
          onClick={() => {
            if (oneUnitOfInputCurrency && marketPrice && outputCurrency) {
              setLimitPrice(
                formatCurrencyAmount({
                  amount: marketPrice
                    .invert()
                    .quote(
                      CurrencyAmount.fromRawAmount(
                        outputCurrency,
                        JSBI.BigInt(parseUnits('1', outputCurrency?.decimals))
                      )
                    ),
                  type: NumberType.SwapTradeAmount,
                  placeholder: '',
                })
              )
            }
            setLimitState((prev) => ({ ...prev, limitPriceInverted: !prev.limitPriceInverted, limitPriceEdited: true }))
          }}
        >
          <ReversedArrowsIcon size="16px" />
        </ReverseIconContainer>
      </Row>
      <TextInputRow>
        <StyledNumericalInput
          disabled={!(inputCurrency && outputCurrency)}
          className="limit-price-input"
          value={formattedLimitPriceOutputAmount}
          onUserInput={setLimitPrice}
          $loading={false}
        />
        {outputCurrency && (
          <OutputCurrencyContainer shouldFetchOnAccountUpdate={currencySelectModalOpen}>
            <OutputCurrencyButton onClick={() => setCurrencySelectModalOpen(true)}>
              <Row gap="xs" width="unset">
                <CurrencyLogo currency={outputCurrency} size="16px" />
                <ThemedText.BodyPrimary className="token-symbol-container">
                  {formatCurrencySymbol(outputCurrency)}
                </ThemedText.BodyPrimary>
              </Row>
            </OutputCurrencyButton>
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
                selected={currentPriceAdjustment === adjustmentPercentage}
                onSelect={() => onSelectLimitPrice(adjustedPrice)}
              />
            )
          })}
        </Row>
      </Row>
      <CurrencySearchModal
        isOpen={currencySelectModalOpen}
        onDismiss={() => setCurrencySelectModalOpen(false)}
        onCurrencySelect={onCurrencySelect}
        selectedCurrency={outputCurrency}
        otherSelectedCurrency={inputCurrency}
        currencySearchFilters={LIMIT_FORM_CURRENCY_SEARCH_FILTERS}
      />
    </InputPanel>
  )
}
