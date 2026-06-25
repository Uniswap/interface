import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useCallback, useMemo, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { iconSizes } from 'ui/src/theme'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTab } from 'uniswap/src/types/screens/interface'
// oxlint-disable-next-line no-restricted-imports -- We need to import this directly so we can format with `en-US` locale
import { formatCurrencyAmount as formatCurrencyAmountRaw } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { parseUnits } from '~/chains'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { SwapCurrencyInput } from '~/components/NumericalInput/NumericalInput'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import {
  LimitCustomMarketPriceButton,
  LimitPresetPriceButton,
} from '~/features/Swap/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceButton'
import { LimitPriceInputLabel } from '~/features/Swap/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputLabel'
import { useCurrentPriceAdjustment } from '~/features/Swap/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { InputPanel } from '~/features/Swap/CurrencyInputPanel/SwapCurrencyInputPanel'
import { formatCurrencySymbol } from '~/features/Swap/CurrencyInputPanel/utils'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { useLimitContext } from '~/pages/Swap/Limit/state/LimitContext'
import { SwitchNetworkAction } from '~/state/popups/types'

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
    // oxlint-disable-next-line no-shadow
    (limitPrice: string) => {
      // Omit parsing errors by checking if amount exceeds Number range limit
      if (!isSafeNumber(limitPrice)) {
        return
      }

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

  const { formatCurrencyAmount } = useLocalizationContext()

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
      value: parsedLimitPrice?.quote(CurrencyAmount.fromRawAmount(baseCurrency, 1)),
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
      JSBI.BigInt(parseUnits('1', baseCurrency.decimals).toString()),
    )
    const getAdjustedPrice = (priceAdjustmentPercentage: number) => {
      return new Price({
        // 100 input token
        baseAmount: CurrencyAmount.fromRawAmount(
          baseCurrency,
          JSBI.BigInt(parseUnits('100', baseCurrency.decimals).toString()),
        ),
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
        JSBI.BigInt(parseUnits('1', baseCurrency.decimals).toString()),
      )
      const marketOutputAmount = adjustedPrice?.quote(oneUnitOfBaseCurrency)
      changeLimitPrice(
        formatCurrencyAmountRaw({
          // Always use `.` as decimal separator for the internal state
          locale: 'en-US',
          amount: marketOutputAmount,
          type: NumberType.SwapTradeAmount,
          placeholder: limitPrice,
        }),
      )
      sendAnalyticsEvent(InterfaceEventName.LimitPresetRateSelected, { value: adjustmentPercentage })
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
        formatCurrencyAmountRaw({
          // Always use `.` as decimal separator for the internal state
          locale: 'en-US',
          amount: marketPrice
            .invert()
            .quote(
              CurrencyAmount.fromRawAmount(
                quoteCurrency,
                JSBI.BigInt(parseUnits('1', quoteCurrency.decimals).toString()),
              ),
            ),
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        }),
      )
    }
    setLimitState((prev) => ({ ...prev, limitPriceInverted: !prev.limitPriceInverted, limitPriceEdited: true }))
    sendAnalyticsEvent(InterfaceEventName.LimitPriceReversed)
  }, [baseCurrency, marketPrice, quoteCurrency, changeLimitPrice, setLimitState])

  const presets = limitPriceInverted ? INVERTED_PRICE_ADJUSTMENT_PRESETS : PRICE_ADJUSTMENT_PRESETS

  return (
    <InputPanel>
      <Flex flexDirection="column" gap="$gap4" width="100%">
        <Flex row width="100%" justifyContent="space-between" alignItems="center">
          <LimitPriceInputLabel
            currency={baseCurrency}
            showCurrencyMessage={!!formattedLimitPriceOutputAmount}
            openCurrencySearchModal={() => setCurrencySelectModalField('inputCurrency')}
          />
          <TouchableArea onPress={onInvertLimitPrices}>
            <ArrowDownArrowUp color="$neutral2" size="$icon.16" />
          </TouchableArea>
        </Flex>
        <Flex row flexGrow={1} alignItems="center" width="100%">
          <SwapCurrencyInput
            disabled={!(baseCurrency && quoteCurrency)}
            className="limit-price-input"
            value={formattedLimitPriceOutputAmount}
            onUserInput={changeLimitPrice}
          />
          {quoteCurrency && (
            <Flex alignItems="center" justifyContent="center">
              <TouchableArea onPress={() => setCurrencySelectModalField('outputCurrency')}>
                <Flex
                  row
                  gap="$spacing4"
                  width="unset"
                  userSelect="none"
                  alignItems="center"
                  overflow="hidden"
                  flexShrink={1}
                  minWidth={0}
                  maxWidth="100%"
                >
                  <CurrencyLogo currency={quoteCurrency} size={iconSizes.icon16} />
                  <Text
                    variant="body2"
                    color="$neutral1"
                    className="token-symbol-container"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    flexShrink={1}
                    minWidth={0}
                  >
                    {formatCurrencySymbol(quoteCurrency)}
                  </Text>
                </Flex>
              </TouchableArea>
            </Flex>
          )}
        </Flex>
        <Flex row mt="$spacing8" width="100%" justifyContent="space-between" alignItems="center">
          <Flex row gap="$spacing8" alignItems="center">
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
          </Flex>
        </Flex>
      </Flex>
      <CurrencySearchModal
        isOpen={Boolean(currencySelectModalField)}
        swapTab={SwapTab.Limit}
        switchNetworkAction={SwitchNetworkAction.Limit}
        chainIds={LIMIT_SUPPORTED_CHAINS}
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
    </InputPanel>
  )
}
