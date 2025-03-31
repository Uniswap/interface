import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import {
  LimitCustomMarketPriceButton,
  LimitPresetPriceButton,
} from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceButton'
import { LimitPriceInputLabel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputLabel'
import { useCurrentPriceAdjustment } from 'components/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { InputPanel } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { formatCurrencySymbol } from 'components/CurrencyInputPanel/utils'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { StyledNumericalInput } from 'components/NumericalInput'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import Row from 'components/deprecated/Row'
import { parseUnits } from 'ethers/lib/utils'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import JSBI from 'jsbi'
import styled from 'lib/styled-components'
import { ReversedArrowsIcon } from 'nft/components/icons'
import { useCallback, useMemo, useState } from 'react'
import { useLimitContext } from 'state/limit/LimitContext'
import { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { ThemedText } from 'theme/components'
import { ClickableStyle } from 'theme/components/styles'
import { Locale } from 'uniswap/src/features/language/constants'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  NumberType,
  formatCurrencyAmount as formatCurrencyAmountWithoutUserLocale,
  useFormatter,
} from 'utils/formatNumbers'

const Container = styled(InputPanel)`
  gap: 4px;
`

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
const INVERTED_PRICE_ADJUSTMENT_PRESETS = [-1, -5, -10]

function invertCurrencyField(field: keyof CurrencyState): keyof CurrencyState {
  return field === 'inputCurrency' ? 'outputCurrency' : 'inputCurrency'
}

interface LimitPriceInputPanelProps {
  onCurrencySelect: (field: keyof CurrencyState, newCurrency: Currency) => void
}

export function LimitPriceInputPanel({ onCurrencySelect }: LimitPriceInputPanelProps) {
  const [currencySelectModalField, setCurrencySelectModalField] = useState<keyof CurrencyState | undefined>(undefined)
  const {
    derivedLimitInfo: { parsedLimitPrice, marketPrice: tradeMarketPrice },
    setLimitState,
    limitState: { limitPrice, limitPriceInverted },
  } = useLimitContext()

  const changeLimitPrice = useCallback(
    (limitPrice: string) => {
      setLimitState((prevState) => ({ ...prevState, limitPrice, limitPriceEdited: true }))
    },
    [setLimitState],
  )

  const {
    currencyState: { inputCurrency, outputCurrency },
  } = useSwapAndLimitContext()

  const [baseCurrency, quoteCurrency, marketPrice] = limitPriceInverted
    ? [outputCurrency, inputCurrency, tradeMarketPrice?.invert()]
    : [inputCurrency, outputCurrency, tradeMarketPrice]

  const { formatCurrencyAmount } = useFormatter()

  const formattedLimitPriceOutputAmount: string = useMemo(() => {
    // If the user has manually typed in a limit price, use that.
    if (limitPrice) {
      return limitPrice
    }
    // Otherwise, use parsedLimitPrice which may have been calculated from input/output amounts.
    if (!baseCurrency) {
      return ''
    }
    return formatCurrencyAmount({
      amount: parsedLimitPrice?.quote(CurrencyAmount.fromRawAmount(baseCurrency, 1)),
      type: NumberType.SwapTradeAmount,
      placeholder: '',
    })
  }, [limitPrice, baseCurrency, formatCurrencyAmount, parsedLimitPrice])

  const adjustedPrices = useMemo(() => {
    if (!marketPrice || !baseCurrency || !quoteCurrency) {
      return undefined
    }
    const oneUnitOfBaseCurrency = CurrencyAmount.fromRawAmount(
      baseCurrency,
      JSBI.BigInt(parseUnits('1', baseCurrency?.decimals)),
    )
    const getAdjustedPrice = (priceAdjustmentPercentage: number) => {
      return new Price({
        // 100 input token
        baseAmount: CurrencyAmount.fromRawAmount(baseCurrency, JSBI.BigInt(parseUnits('100', baseCurrency.decimals))),
        // (100 + adjustmentPercentage) times the market quote amount for 1 input token
        quoteAmount: CurrencyAmount.fromRawAmount(
          quoteCurrency,
          JSBI.multiply(
            JSBI.BigInt(100 + priceAdjustmentPercentage),
            marketPrice.quote(oneUnitOfBaseCurrency).quotient,
          ),
        ),
      })
    }
    return limitPriceInverted
      ? {
          [-1]: getAdjustedPrice(-1),
          [-5]: getAdjustedPrice(-5),
          [-10]: getAdjustedPrice(-10),
        }
      : {
          1: getAdjustedPrice(1),
          5: getAdjustedPrice(5),
          10: getAdjustedPrice(10),
        }
  }, [marketPrice, baseCurrency, quoteCurrency, limitPriceInverted])

  const onSelectLimitPrice = useCallback(
    (adjustedPrice: Price<Currency, Currency> | undefined, adjustmentPercentage: number) => {
      if (!baseCurrency) {
        return
      }
      const oneUnitOfBaseCurrency = CurrencyAmount.fromRawAmount(
        baseCurrency,
        JSBI.BigInt(parseUnits('1', baseCurrency?.decimals)),
      )
      const marketOutputAmount = adjustedPrice?.quote(oneUnitOfBaseCurrency)
      changeLimitPrice(
        formatCurrencyAmountWithoutUserLocale({
          amount: marketOutputAmount,
          type: NumberType.SwapTradeAmount,
          placeholder: limitPrice,
          locale: Locale.EnglishUnitedStates,
        }),
      )
      sendAnalyticsEvent(InterfaceEventNameLocal.LimitPresetRateSelected, { value: adjustmentPercentage })
    },
    [baseCurrency, limitPrice, changeLimitPrice],
  )

  const { currentPriceAdjustment } = useCurrentPriceAdjustment({
    parsedLimitPrice,
    marketPrice,
    baseCurrency,
    quoteCurrency,
    limitPriceInverted,
  })

  const onInvertLimitPrices = useCallback(() => {
    if (baseCurrency && marketPrice && quoteCurrency) {
      changeLimitPrice(
        formatCurrencyAmountWithoutUserLocale({
          amount: marketPrice
            .invert()
            .quote(CurrencyAmount.fromRawAmount(quoteCurrency, JSBI.BigInt(parseUnits('1', quoteCurrency?.decimals)))),
          type: NumberType.SwapTradeAmount,
          placeholder: '',
          locale: Locale.EnglishUnitedStates,
        }),
      )
    }
    setLimitState((prev) => ({ ...prev, limitPriceInverted: !prev.limitPriceInverted, limitPriceEdited: true }))
    sendAnalyticsEvent(InterfaceEventNameLocal.LimitPriceReversed)
  }, [baseCurrency, marketPrice, quoteCurrency, changeLimitPrice, setLimitState])

  const presets = limitPriceInverted ? INVERTED_PRICE_ADJUSTMENT_PRESETS : PRICE_ADJUSTMENT_PRESETS

  return (
    <Container>
      <Row justify="space-between">
        <LimitPriceInputLabel
          currency={baseCurrency}
          showCurrencyMessage={!!formattedLimitPriceOutputAmount}
          openCurrencySearchModal={() => setCurrencySelectModalField('inputCurrency')}
        />
        <ReverseIconContainer onClick={onInvertLimitPrices}>
          <ReversedArrowsIcon size="16px" />
        </ReverseIconContainer>
      </Row>
      <TextInputRow>
        <StyledNumericalInput
          disabled={!(baseCurrency && quoteCurrency)}
          className="limit-price-input"
          value={formattedLimitPriceOutputAmount}
          onUserInput={changeLimitPrice}
          $loading={false}
        />
        {quoteCurrency && (
          <OutputCurrencyContainer>
            <OutputCurrencyButton onClick={() => setCurrencySelectModalField('outputCurrency')}>
              <Row gap="xs" width="unset">
                <CurrencyLogo currency={quoteCurrency} size={16} />
                <ThemedText.BodyPrimary className="token-symbol-container">
                  {formatCurrencySymbol(quoteCurrency)}
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
            customAdjustmentPercentage={(() => {
              if (!currentPriceAdjustment || currentPriceAdjustment === 0) {
                return undefined
              }
              if (presets.includes(currentPriceAdjustment)) {
                return undefined
              }
              return currentPriceAdjustment
            })()}
            disabled={!baseCurrency || !quoteCurrency}
            selected={Boolean(currentPriceAdjustment !== undefined && !presets.includes(currentPriceAdjustment))}
            onSelect={() => onSelectLimitPrice(marketPrice, 0)}
          />
          {presets.map((adjustmentPercentage) => {
            const adjustedPrice = adjustedPrices?.[adjustmentPercentage as keyof typeof adjustedPrices]
            return (
              <LimitPresetPriceButton
                key={`limit-price-${adjustmentPercentage}`}
                priceAdjustmentPercentage={adjustmentPercentage}
                disabled={!baseCurrency || !quoteCurrency || !marketPrice}
                selected={currentPriceAdjustment === adjustmentPercentage}
                onSelect={() => onSelectLimitPrice(adjustedPrice, adjustmentPercentage)}
              />
            )
          })}
        </Row>
      </Row>
      <CurrencySearchModal
        isOpen={Boolean(currencySelectModalField)}
        onDismiss={() => setCurrencySelectModalField(undefined)}
        onCurrencySelect={(currency) => {
          if (!currencySelectModalField) {
            return
          }
          onCurrencySelect(
            limitPriceInverted ? invertCurrencyField(currencySelectModalField) : currencySelectModalField,
            currency,
          )
        }}
        selectedCurrency={quoteCurrency}
        otherSelectedCurrency={baseCurrency}
      />
    </Container>
  )
}
