import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useDynamicFontSizing } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getEarnAmountValidation,
  getEarnDepositMinimumValidation,
  getEarnDepositPercentageInput,
  getMaxDepositTokenAmount,
  getProjectedAnnualEarnings,
} from 'uniswap/src/features/earn/amount'
import { useEarnMinDepositUsd } from 'uniswap/src/features/earn/config'
import { EARN_INPUT_ERROR_DEBOUNCE_MS } from 'uniswap/src/features/earn/constants'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import type { EarnDepositSourceOption, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { useDebounce } from 'utilities/src/time/timing'
import { AlternateCurrencyDisplay } from '~/components/AlternateCurrencyDisplay/AlternateCurrencyDisplay'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
} from '~/components/NumericalInput/LargeAmountInput'
import { DepositTokenSelector } from '~/features/earn/DepositTokenSelector'
import { EarnAmountViewHeader } from '~/features/earn/EarnAmountViewHeader'
import { PredefinedAmount } from '~/pages/Swap/Buy/PredefinedAmount'

const CHAR_WIDTH = 45
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 24
const INPUT_MAX_WIDTH = 360
const FIAT_DECIMALS = 2

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const

interface DepositAmountViewProps {
  vault: EarnVaultInfo
  depositSourceOptions: EarnDepositSourceOption[]
  selectedDepositSource: EarnDepositSourceOption | undefined
  onSelectDepositSource: (currencyId: string) => void
  unsupportedDepositSourceOptions: EarnDepositSourceOption[]
  initialAmount?: string
  initialIsMax?: boolean
  onBack: () => void
  onClose: () => void
  onReview: (params: {
    amount: string
    sourceChainId: UniverseChainId
    sourceCurrencyId: string
    isMax?: boolean
    tokenAmount?: string
  }) => void
}

export function DepositAmountView({
  vault,
  depositSourceOptions,
  selectedDepositSource,
  onSelectDepositSource,
  unsupportedDepositSourceOptions,
  initialAmount = '',
  initialIsMax = false,
  onBack,
  onClose,
  onReview,
}: DepositAmountViewProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmount, formatNumberOrString, formatPercent } = useLocalizationContext()
  const minDepositUsd = useEarnMinDepositUsd()
  const fiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(fiatCurrency)

  const currency = selectedDepositSource?.currencyInfo.currency

  const availableBalanceQuantity = selectedDepositSource?.balanceQuantity ?? 0
  const availableBalanceUsd = selectedDepositSource?.balanceUsd

  const [amount, setAmount] = useState(initialAmount)
  const [inputInFiat, setInputInFiat] = useState(true)
  // Max uses exact token balance instead of display-rounded fiat.
  const [isMaxSelected, setIsMaxSelected] = useState(initialIsMax)
  const inputRef = useRef<ComponentRef<typeof StyledNumericalInput>>(null)
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const { fontSize, onLayout, onSetFontSize, onExtraElementLayout } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CHAR_WIDTH,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    maxWidth: INPUT_MAX_WIDTH,
  })
  const selectedDepositSourceId = selectedDepositSource?.currencyInfo.currencyId
  const previousDepositSourceIdRef = useRef(selectedDepositSourceId)

  // Recalculate font sizing once on mount when seeded with a non-empty amount
  // (e.g., navigating back from the review view).
  useEffect(() => {
    if (initialAmount) {
      onSetFontSize(initialAmount)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- intentional run-once on mount
  }, [])

  useEffect(() => {
    if (previousDepositSourceIdRef.current === selectedDepositSourceId) {
      return
    }

    previousDepositSourceIdRef.current = selectedDepositSourceId
    setAmount('')
    setInputInFiat(true)
    setIsMaxSelected(false)
    onSetFontSize('')
  }, [onSetFontSize, selectedDepositSourceId])

  // Source chain drives the fiat<->token conversion — per-chain variants price independently.
  const { fiatToToken, tokenToFiat } = useFiatTokenConversion({ currency })
  const convertUsdToLocalFiat = useCallback(
    (balanceUsd: number): number => convertFiatAmount(balanceUsd).amount,
    [convertFiatAmount],
  )
  const selectedDepositSourceBalanceAmount = useMemo(
    () =>
      selectedDepositSource && currency
        ? getCurrencyAmount({
            value: selectedDepositSource.balanceRaw ?? availableBalanceQuantity.toFixed(currency.decimals),
            valueType: selectedDepositSource.balanceRaw ? ValueType.Raw : ValueType.Exact,
            currency,
          })
        : undefined,
    [availableBalanceQuantity, currency, selectedDepositSource],
  )
  const maxSpendableAmount = useMaxAmountSpend({
    currencyAmount: selectedDepositSourceBalanceAmount,
    txType: TransactionType.Deposit,
  })
  const maxDepositTokenAmount = useMemo(() => {
    if (!selectedDepositSource || !currency) {
      return undefined
    }

    if (currency.isNative && maxSpendableAmount) {
      return maxSpendableAmount.toExact()
    }

    return getMaxDepositTokenAmount({
      balanceQuantity: availableBalanceQuantity,
      balanceRaw: selectedDepositSource.balanceRaw,
      currency,
    })
  }, [availableBalanceQuantity, currency, maxSpendableAmount, selectedDepositSource])

  const handleUserInput = useCallback(
    (value: string) => {
      if (!isSafeNumber(value)) {
        return
      }
      const normalized = value.replace(/^0+(?=\d)/, '')
      onSetFontSize(normalized)
      setAmount(normalized)
      setIsMaxSelected(false)
    },
    [onSetFontSize],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const percentageInput = getEarnDepositPercentageInput({
        balanceQuantity: availableBalanceQuantity,
        balanceUsd: availableBalanceUsd,
        convertUsdToLocalFiat,
        exactMaxTokenAmount: maxDepositTokenAmount,
        fiatDecimals: FIAT_DECIMALS,
        percentage: pct,
        tokenDecimals: currency?.decimals ?? FIAT_DECIMALS,
      })
      const isMax = pct === 1
      const inputInFiatNext = percentageInput.inputInFiat
      const value = inputInFiatNext ? percentageInput.exactAmountFiat : percentageInput.exactAmountToken
      setInputInFiat(inputInFiatNext)
      setIsMaxSelected(isMax)
      onSetFontSize(value)
      setAmount(value)
    },
    [
      availableBalanceQuantity,
      availableBalanceUsd,
      convertUsdToLocalFiat,
      currency?.decimals,
      maxDepositTokenAmount,
      onSetFontSize,
    ],
  )

  const parsedAmount = Number(amount) || 0

  const alternateDisplayAmount = useMemo(() => {
    if (!amount) {
      return undefined
    }
    return inputInFiat ? (fiatToToken(amount) ?? undefined) : (tokenToFiat(amount) ?? undefined)
  }, [amount, fiatToToken, inputInFiat, tokenToFiat])

  // Validate in token units so unpriced tokens (no USD valuation) still gate over-balance.
  const inputAsTokens = useMemo<number | undefined>(() => {
    if (parsedAmount <= 0) {
      return 0
    }
    if (!inputInFiat) {
      return parsedAmount
    }
    const tokenStr = fiatToToken(amount)
    return tokenStr !== null ? Number(tokenStr) : undefined
  }, [amount, fiatToToken, inputInFiat, parsedAmount])

  const inputAsLocalFiat = useMemo<number | undefined>(() => {
    if (parsedAmount <= 0) {
      return 0
    }
    if (inputInFiat) {
      return parsedAmount
    }
    const fiatAmount = tokenToFiat(amount)
    return fiatAmount !== null ? Number(fiatAmount) : undefined
  }, [amount, inputInFiat, parsedAmount, tokenToFiat])

  const minimumDepositLocalFiat = convertFiatAmount(minDepositUsd).amount
  const isBelowMinimumDeposit = getEarnDepositMinimumValidation({
    inputAmount: inputAsLocalFiat,
    minimumAmount: minimumDepositLocalFiat,
  })
  const debouncedIsBelowMinimumDeposit = useDebounce(isBelowMinimumDeposit, EARN_INPUT_ERROR_DEBOUNCE_MS)

  // Review needs fiat math plus token units for over-balance checks.
  const { isOverBalance, isReviewDisabled } = getEarnAmountValidation({
    availableAmount: availableBalanceQuantity,
    comparisonAmount: inputAsTokens,
    hasRequiredSelection: selectedDepositSource !== undefined,
    inputAmount: parsedAmount,
    isConversionPending: !inputInFiat && alternateDisplayAmount === undefined,
    // "Max" deposits spend the exact token balance, so the displayed fiat amount (rounded up for
    // display, then re-priced at spot) can sit a hair above the balance without being invalid.
    skipOverBalanceCheck: isMaxSelected,
  })

  // Base projection on local-fiat so the figure stays comparable across unit toggles.
  const projectedEarningsBaseLocalFiat = inputInFiat
    ? parsedAmount
    : parsedAmount > 0
      ? Number(tokenToFiat(amount) ?? 0)
      : 0
  const projectedAnnualEarnings = getProjectedAnnualEarnings({
    balance: projectedEarningsBaseLocalFiat,
    apyPercent: vault.apyPercent,
  })

  const formatLocalFiat = useCallback(
    (value: number): string =>
      formatNumberOrString({
        value,
        type: NumberType.FiatStandard,
        currencyCode: fiatCurrency,
      }),
    [fiatCurrency, formatNumberOrString],
  )

  const showDepositMinimumError = isBelowMinimumDeposit && debouncedIsBelowMinimumDeposit
  const depositMinimumError = showDepositMinimumError
    ? t('explore.earn.deposit.minimum', {
        amount: formatLocalFiat(minimumDepositLocalFiat),
      })
    : undefined
  const ctaLabel = isOverBalance
    ? t('explore.earn.deposit.insufficientBalance')
    : isBelowMinimumDeposit
      ? t('explore.earn.deposit.enterLargerAmount')
      : t('common.button.review')
  const apyLabel = t('explore.earn.vault.rateValue', {
    apy: formatPercent(vault.apyPercent, 2),
  })

  const scaledInputWidth = useMemo(
    () => (amount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined),
    [amount, hiddenObserver.width],
  )

  // Wire format is local fiat — review converts to USD internally. See useEarnVaultModalFlow.
  const handleReview = useCallback(() => {
    if (!selectedDepositSource) {
      return
    }
    const localFiat = inputInFiat ? amount : tokenToFiat(amount)
    if (localFiat === null) {
      return
    }
    onReview({
      amount: localFiat,
      sourceChainId: selectedDepositSource.chainId,
      sourceCurrencyId: selectedDepositSource.currencyInfo.currencyId,
      isMax: isMaxSelected,
      // Max quotes against the exact token balance, reserving gas for native deposit sources.
      tokenAmount: isMaxSelected ? maxDepositTokenAmount : undefined,
    })
  }, [amount, inputInFiat, isMaxSelected, maxDepositTokenAmount, onReview, selectedDepositSource, tokenToFiat])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // Toggle also converts the value so $1 of ETH becomes ~0.0003 ETH (not the literal string).
  const handleToggleInputUnit = useCallback(() => {
    setInputInFiat((prev) => {
      const next = !prev
      if (!amount) {
        return next
      }
      const converted = next ? tokenToFiat(amount) : fiatToToken(amount)
      if (converted === null) {
        // No price yet — leave the input as-is.
        return next
      }
      const trimmed = next ? Number(converted).toFixed(FIAT_DECIMALS) : converted
      onSetFontSize(trimmed)
      setAmount(trimmed)
      return next
    })
  }, [amount, fiatToToken, onSetFontSize, tokenToFiat])

  const maxDecimals = inputInFiat ? FIAT_DECIMALS : (currency?.decimals ?? FIAT_DECIMALS)

  return (
    <Flex gap="$spacing16">
      <EarnAmountViewHeader title={t('explore.earn.deposit.title')} onBack={onBack} onClose={onClose} />

      <Flex gap="$spacing4">
        <Flex
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          px="$spacing24"
          py="$spacing48"
          gap="$spacing16"
          alignItems="center"
          position="relative"
          cursor="text"
          onPress={focusInput}
          onLayout={onLayout}
        >
          <NumericalInputWrapper>
            <Flex onLayout={onExtraElementLayout}>
              {inputInFiat && (
                <NumericalInputSymbolContainer showPlaceholder={!amount} numericalFontSize={fontSize}>
                  {fiatSymbol}
                </NumericalInputSymbolContainer>
              )}
            </Flex>
            <StyledNumericalInput
              value={amount}
              onUserInput={handleUserInput}
              placeholder="0"
              fieldWidth={scaledInputWidth}
              numericalFontSize={fontSize}
              hasPrefix={inputInFiat}
              maxDecimals={maxDecimals}
              ref={inputRef}
            />
            <NumericalInputMimic ref={hiddenObserver.ref} numericalFontSize={fontSize}>
              {amount}
            </NumericalInputMimic>
          </NumericalInputWrapper>

          {currency && amount ? (
            <Flex height={36} justifyContent="center">
              <AlternateCurrencyDisplay
                inputCurrency={currency}
                inputInFiat={inputInFiat}
                exactAmountOut={alternateDisplayAmount}
                onToggle={handleToggleInputUnit}
                disabled={alternateDisplayAmount === undefined}
              />
            </Flex>
          ) : (
            <Flex row alignItems="center" gap="$spacing8" justifyContent="center" flexWrap="wrap">
              {PERCENT_OPTIONS.map((pct) => (
                <PredefinedAmount
                  key={pct}
                  label={pct === 1 ? t('common.max') : `${Math.round(pct * 100)}%`}
                  disabled={!selectedDepositSource}
                  onPress={() => handlePercentPress(pct)}
                />
              ))}
            </Flex>
          )}
          {depositMinimumError && (
            <Flex position="absolute" left="$spacing24" right="$spacing24" bottom="$spacing12">
              <EarnInlineError message={depositMinimumError} />
            </Flex>
          )}
        </Flex>

        <DepositTokenSelector
          displayBalanceInFiat={inputInFiat}
          options={depositSourceOptions}
          selectedSourceCurrencyId={selectedDepositSource?.currencyInfo.currencyId ?? vault.currencyId}
          onSelectSourceCurrency={onSelectDepositSource}
          unsupportedOptions={unsupportedDepositSourceOptions}
        />
      </Flex>

      <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
        <Text variant="body3" color="$accent1">
          {apyLabel}
        </Text>
        <Text variant="body3" color={parsedAmount > 0 ? '$statusSuccess' : '$neutral2'}>
          {`+${formatLocalFiat(projectedAnnualEarnings)} `}
          <Text variant="body3" color="$neutral2">
            {t('explore.earn.deposit.perYear')}
          </Text>
        </Text>
      </Flex>

      <Button
        fill={false}
        width="100%"
        variant="branded"
        emphasis="primary"
        size="large"
        disabled={isReviewDisabled || isBelowMinimumDeposit}
        onPress={handleReview}
      >
        {ctaLabel}
      </Button>
    </Flex>
  )
}
