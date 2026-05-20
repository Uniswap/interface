import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea, useDynamicFontSizing } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { PredefinedAmount } from '~/pages/Swap/Buy/PredefinedAmount'
import { AlternateCurrencyDisplay } from '~/pages/Swap/common/AlternateCurrencyDisplay'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
} from '~/pages/Swap/common/shared'

const CHAR_WIDTH = 45
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 24
const INPUT_MAX_WIDTH = 360
const FIAT_DECIMALS = 2

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const

interface DepositAmountViewProps {
  vault: EarnVaultInfo
  availableBalance: number
  initialAmount?: string
  onBack: () => void
  onClose: () => void
  onReview: (amount: string) => void
}

export function DepositAmountView({
  vault,
  availableBalance,
  initialAmount = '',
  onBack,
  onClose,
  onReview,
}: DepositAmountViewProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? 'USDC'

  const [amount, setAmount] = useState(initialAmount)
  const [inputInFiat, setInputInFiat] = useState(true)
  const inputRef = useRef<ComponentRef<typeof StyledNumericalInput>>(null)
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const { fontSize, onLayout, onSetFontSize, onExtraElementLayout } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CHAR_WIDTH,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    maxWidth: INPUT_MAX_WIDTH,
  })

  // Recalculate font sizing once on mount when seeded with a non-empty amount
  // (e.g., navigating back from the review view).
  useEffect(() => {
    if (initialAmount) {
      onSetFontSize(initialAmount)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- intentional run-once on mount
  }, [])

  const handleUserInput = useCallback(
    (value: string) => {
      if (!isSafeNumber(value)) {
        return
      }
      const normalized = value.replace(/^0+(?=\d)/, '')
      onSetFontSize(normalized)
      setAmount(normalized)
    },
    [onSetFontSize],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      // TODO(CONS-1784): availableBalance is a single mocked number used for both fiat ($) and token modes.
      // Once real wallet balance + quote-driven fiat/token conversion land, pick the value in the active unit.
      const value = (availableBalance * pct).toFixed(FIAT_DECIMALS)
      onSetFontSize(value)
      setAmount(value)
    },
    [availableBalance, onSetFontSize],
  )

  const parsedAmount = Number(amount) || 0
  const isOverBalance = parsedAmount > availableBalance
  const isReviewDisabled = parsedAmount <= 0 || isOverBalance

  const projectedAnnualEarnings = parsedAmount * (vault.apyPercent / 100)

  const formatFiat = useCallback(
    (value: number): string => formatNumberOrString({ value, type: NumberType.FiatStandard }),
    [formatNumberOrString],
  )

  const balanceLabel = `${formatNumberOrString({ value: availableBalance, type: NumberType.TokenNonTx })} ${t(
    'explore.earn.deposit.available',
  )}`

  const ctaLabel = isOverBalance ? t('explore.earn.deposit.insufficientBalance') : t('common.button.review')

  const scaledInputWidth = useMemo(
    () => (amount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined),
    [amount, hiddenObserver.width],
  )

  const handleReview = useCallback(() => {
    onReview(amount)
  }, [amount, onReview])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const handleToggleInputUnit = useCallback(() => setInputInFiat((prev) => !prev), [])

  return (
    <Flex gap="$spacing16">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onBack} hoverable>
          <BackArrow color="$neutral2" size="$icon.24" />
        </TouchableArea>
        <Text variant="body2" color="$neutral1">
          {t('explore.earn.deposit.title')}
        </Text>
        <ModalCloseIcon onClose={onClose} />
      </Flex>

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
          cursor="text"
          onPress={focusInput}
          onLayout={onLayout}
        >
          <NumericalInputWrapper>
            <Flex onLayout={onExtraElementLayout}>
              {inputInFiat && (
                <NumericalInputSymbolContainer showPlaceholder={!amount} numericalFontSize={fontSize}>
                  $
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
              maxDecimals={FIAT_DECIMALS}
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
                exactAmountOut={amount}
                onToggle={handleToggleInputUnit}
              />
            </Flex>
          ) : (
            <Flex row alignItems="center" gap="$spacing8" justifyContent="center" flexWrap="wrap">
              {PERCENT_OPTIONS.map((pct) => (
                <PredefinedAmount
                  key={pct}
                  label={pct === 1 ? t('common.max') : `${Math.round(pct * 100)}%`}
                  onPress={() => handlePercentPress(pct)}
                />
              ))}
            </Flex>
          )}
        </Flex>

        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          p="$spacing16"
        >
          <Flex row alignItems="center" gap="$spacing12">
            <TokenLogo
              url={currencyInfo?.logoUrl}
              size={iconSizes.icon32}
              chainId={currency?.chainId}
              symbol={symbol}
              name={currency?.name}
            />
            <Flex>
              <Text variant="body2" color="$neutral1">
                {symbol}
              </Text>
              <Text variant="body3" color="$neutral2">
                {balanceLabel}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="body3" color="$accent1">
          {t('explore.earn.vault.rateValue', { apy: formatPercent(vault.apyPercent) })}
        </Text>
        <Text variant="body3" color={parsedAmount > 0 ? '$statusSuccess' : '$neutral2'}>
          {`+${formatFiat(projectedAnnualEarnings)} `}
          <Text variant="body3" color="$neutral2">
            {t('explore.earn.deposit.perYear')}
          </Text>
        </Text>
      </Flex>

      <Button emphasis="primary" size="large" py="$spacing24" isDisabled={isReviewDisabled} onPress={handleReview}>
        {ctaLabel}
      </Button>
    </Flex>
  )
}
