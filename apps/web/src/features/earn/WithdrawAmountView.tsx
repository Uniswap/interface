import { TradingApi } from '@universe/api'
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Text, useDynamicFontSizing } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getEarnAmountValidation,
  getEarnFiatPercentageInput,
  getEarnWithdrawableAmount,
} from 'uniswap/src/features/earn/amount'
import { EARN_INPUT_ERROR_DEBOUNCE_MS } from 'uniswap/src/features/earn/constants'
import { EarnInlineError } from 'uniswap/src/features/earn/EarnInlineError'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance, MORPHO_FAQ_URL } from 'uniswap/src/features/earn/utils'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/withdrawDestination'
import { WithdrawLiquidityInfoPopover } from 'uniswap/src/features/earn/WithdrawLiquidityInfoPopover'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { useDebounce } from 'utilities/src/time/timing'
import { AlternateCurrencyDisplay } from '~/components/AlternateCurrencyDisplay/AlternateCurrencyDisplay'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
} from '~/components/NumericalInput/LargeAmountInput'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { EARN_SELECTOR_DROPDOWN_MAX_HEIGHT } from '~/features/earn/constants'
import { EarnAmountViewHeader } from '~/features/earn/EarnAmountViewHeader'
import {
  getSelectedWithdrawDestinationChainId,
  getWithdrawDestinationChainIds,
} from '~/features/earn/withdrawDestinationChains'

const CHAR_WIDTH = 45
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 24
const INPUT_MAX_WIDTH = 360
const FIAT_DECIMALS = 2

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const

interface WithdrawAmountViewProps {
  vault: EarnVaultInfo
  position: EarnPositionInfo
  initialAmount?: string
  initialChainId?: UniverseChainId
  initialWithdrawMode?: TradingApi.EarnWithdrawMode
  onBack: () => void
  onClose: () => void
  onReview: (params: { amount: string; chainId: UniverseChainId; withdrawMode: TradingApi.EarnWithdrawMode }) => void
}

function getWithdrawCtaLabel({
  hasPositionBalance,
  inputAmount,
  isOverBalance,
  isOverWithdrawableLiquidity,
  labels,
}: {
  hasPositionBalance: boolean
  inputAmount: number
  isOverBalance: boolean
  isOverWithdrawableLiquidity: boolean
  labels: {
    enterAmount: string
    insufficientBalance: string
    loading: string
    lowLiquidity: string
    review: string
  }
}): string {
  if (inputAmount <= 0) {
    return labels.enterAmount
  }

  if (!hasPositionBalance) {
    return labels.loading
  }

  if (isOverWithdrawableLiquidity) {
    return labels.lowLiquidity
  }

  if (isOverBalance) {
    return labels.insufficientBalance
  }

  return labels.review
}

export function WithdrawAmountView({
  vault,
  position,
  initialAmount = '',
  initialChainId = UniverseChainId.Unichain,
  initialWithdrawMode,
  onBack,
  onClose,
  onReview,
}: WithdrawAmountViewProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmount, convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const fiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(fiatCurrency)
  const { isTestnetModeEnabled } = useEnabledChains()
  const withdrawDestinationChainIds = useMemo(
    () => getWithdrawDestinationChainIds({ isTestnetModeEnabled, vault }),
    [isTestnetModeEnabled, vault],
  )
  const withdrawableAmount = getEarnWithdrawableAmount({ position, vault })
  const withdrawableBalanceUsd = withdrawableAmount.availableUsd
  const availableBalanceLocal = convertFiatAmount(withdrawableBalanceUsd).amount

  const [amount, setAmount] = useState(initialAmount)
  const [inputInFiat, setInputInFiat] = useState(true)
  const [selectedChainId, setSelectedChainId] = useState<UniverseChainId>(initialChainId)
  const chainId = getSelectedWithdrawDestinationChainId({
    initialChainId,
    selectedChainId,
    withdrawDestinationChainIds,
  })
  const activeAddresses = useActiveAddresses()
  const tieredNetworkOptions = useNetworkSelectorOptions({
    addresses: activeAddresses,
    chainIds: withdrawDestinationChainIds,
  })
  const destinationCurrencyId = chainId
    ? getEarnVaultWithdrawDestinationCurrencyId({ vault, destinationChainId: chainId })
    : undefined
  const currencyInfo = useCurrencyInfo(destinationCurrencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''
  // Preserve Max mode across review/back navigation.
  const [withdrawMode, setWithdrawMode] = useState<TradingApi.EarnWithdrawMode>(
    initialWithdrawMode ?? TradingApi.EarnWithdrawMode.EXACT_ASSETS,
  )
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
      setWithdrawMode(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
    },
    [onSetFontSize],
  )
  const convertUsdToLocalFiat = useCallback(
    (balanceUsd: number): number => convertFiatAmount(balanceUsd).amount,
    [convertFiatAmount],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const value = getEarnFiatPercentageInput({
        balanceUsd: withdrawableBalanceUsd,
        convertUsdToLocalFiat,
        fiatDecimals: FIAT_DECIMALS,
        percentage: pct,
        rounding: pct === 1 && withdrawableAmount.isLiquidityLimited ? 'down' : 'nearest',
      })
      onSetFontSize(value)
      setAmount(value)
      setInputInFiat(true)
      setWithdrawMode(
        pct === 1 && !withdrawableAmount.isLiquidityLimited
          ? TradingApi.EarnWithdrawMode.MAX_SHARES
          : TradingApi.EarnWithdrawMode.EXACT_ASSETS,
      )
    },
    [convertUsdToLocalFiat, onSetFontSize, withdrawableAmount.isLiquidityLimited, withdrawableBalanceUsd],
  )

  useEffect(() => {
    if (withdrawableAmount.isLiquidityLimited && withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES) {
      setWithdrawMode(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
    }
  }, [withdrawMode, withdrawableAmount.isLiquidityLimited])

  const parsedAmount = Number(amount) || 0
  const { fiatToToken, tokenToFiat } = useFiatTokenConversion({ currency })

  const alternateDisplayAmount = useMemo(() => {
    if (!amount) {
      return undefined
    }
    return inputInFiat ? (fiatToToken(amount) ?? undefined) : (tokenToFiat(amount) ?? undefined)
  }, [amount, fiatToToken, inputInFiat, tokenToFiat])

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

  const hasPositionBalance = hasConfirmedEarnPositionRawBalance(position)
  const { isOverBalance, isReviewDisabled } = getEarnAmountValidation({
    availableAmount: availableBalanceLocal,
    comparisonAmount: inputAsLocalFiat,
    hasRequiredSelection: hasPositionBalance && destinationCurrencyId !== undefined && currency !== undefined,
    inputAmount: parsedAmount,
    skipOverBalanceCheck:
      withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES && !withdrawableAmount.isLiquidityLimited,
  })
  const isOverWithdrawableLiquidity = withdrawableAmount.isLiquidityLimited && isOverBalance
  const debouncedIsOverWithdrawableLiquidity = useDebounce(isOverWithdrawableLiquidity, EARN_INPUT_ERROR_DEBOUNCE_MS)
  const withdrawableBalanceFormatted = convertFiatAmountFormatted(withdrawableBalanceUsd, NumberType.FiatStandard)
  const showLiquidityError = debouncedIsOverWithdrawableLiquidity

  // Available is vault-redeemable value, not destination-chain wallet balance.
  const balanceLabel = `${withdrawableBalanceFormatted} ${t('explore.earn.deposit.available')}`
  const depositedBalanceFormatted = convertFiatAmountFormatted(position.depositedUsd, NumberType.FiatStandard)

  const ctaLabel = getWithdrawCtaLabel({
    hasPositionBalance,
    inputAmount: parsedAmount,
    isOverBalance,
    isOverWithdrawableLiquidity,
    labels: {
      enterAmount: t('explore.earn.withdraw.enterAmount'),
      insufficientBalance: t('explore.earn.deposit.insufficientBalance'),
      loading: t('common.loading'),
      lowLiquidity: t('explore.earn.withdraw.lowLiquidity.cta'),
      review: t('common.button.review'),
    },
  })

  const scaledInputWidth = useMemo(
    () => (amount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined),
    [amount, hiddenObserver.width],
  )

  const handleReview = useCallback(() => {
    if (!hasPositionBalance || !currency || !chainId) {
      return
    }
    const localFiat = inputInFiat ? amount : tokenToFiat(amount)
    if (localFiat === null) {
      return
    }
    onReview({ amount: localFiat, chainId, withdrawMode })
  }, [amount, chainId, currency, hasPositionBalance, inputInFiat, onReview, tokenToFiat, withdrawMode])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const handleToggleInputUnit = useCallback(() => {
    setInputInFiat((prev) => {
      const next = !prev
      if (!amount) {
        return next
      }
      const converted = next ? tokenToFiat(amount) : fiatToToken(amount)
      if (converted === null) {
        return next
      }
      const trimmed = next ? Number(converted).toFixed(FIAT_DECIMALS) : converted
      onSetFontSize(trimmed)
      setAmount(trimmed)
      return next
    })
  }, [amount, fiatToToken, onSetFontSize, tokenToFiat])

  const handleNetworkChange = useCallback((next: UniverseChainId | undefined) => {
    if (next) {
      setSelectedChainId(next)
    }
  }, [])

  const chainLabel = chainId ? getChainInfo(chainId).label : t('common.unavailable')
  const maxDecimals = inputInFiat ? FIAT_DECIMALS : (currency?.decimals ?? FIAT_DECIMALS)

  return (
    <Flex gap="$spacing16">
      <EarnAmountViewHeader title={t('explore.earn.withdraw.title')} onBack={onBack} onClose={onClose} />

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
                <Button
                  key={pct}
                  fill={false}
                  minWidth="$spacing60"
                  size="medium"
                  emphasis="tertiary"
                  onPress={() => handlePercentPress(pct)}
                >
                  {pct === 1 ? t('common.max') : `${Math.round(pct * 100)}%`}
                </Button>
              ))}
            </Flex>
          )}
          {showLiquidityError && (
            <Flex position="absolute" left="$spacing24" right="$spacing24" bottom="$spacing12">
              <Flex row centered flexWrap="wrap" gap="$spacing4">
                <EarnInlineError
                  message={t('explore.earn.withdraw.lowLiquidity.available', {
                    amount: withdrawableBalanceFormatted,
                  })}
                />
                <Anchor href={MORPHO_FAQ_URL} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
                  <Text color="$neutral1" variant="buttonLabel3">
                    {t('common.button.learn')}
                  </Text>
                </Anchor>
              </Flex>
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
                {currency?.name ?? t('common.unavailable')}
              </Text>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  {balanceLabel}
                </Text>
                {withdrawableAmount.isLiquidityLimited && (
                  <WithdrawLiquidityInfoPopover
                    currencyInfo={currencyInfo}
                    depositedBalanceFormatted={depositedBalanceFormatted}
                    withdrawableBalanceFormatted={withdrawableBalanceFormatted}
                  />
                )}
              </Flex>
            </Flex>
          </Flex>
          <Text variant="body3" color="$accent1">
            {t('explore.earn.vault.rateValue', {
              apy: formatPercent(vault.apyPercent, 2),
            })}
          </Text>
        </Flex>

        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          pl="$spacing16"
          pr="$spacing8"
          py="$spacing4"
        >
          <Text variant="body2" color="$neutral2">
            {t('explore.earn.withdraw.to')}
          </Text>
          <NetworkFilter
            networks={withdrawDestinationChainIds}
            currentChainId={chainId}
            isTriggerStyled={false}
            showMultichainOption={false}
            position="right"
            positionFixed
            showSearch
            tieredOptions={tieredNetworkOptions}
            dropdownStyle={{ maxHeight: EARN_SELECTOR_DROPDOWN_MAX_HEIGHT }}
            onPress={handleNetworkChange}
            customTrigger={
              <Flex row alignItems="center" gap="$spacing6">
                {chainId && <ChainLogo chainId={chainId} size={iconSizes.icon20} />}
                <Text variant="body2" color="$neutral1">
                  {chainLabel}
                </Text>
              </Flex>
            }
          />
        </Flex>
      </Flex>

      <Button
        fill={false}
        width="100%"
        variant="branded"
        emphasis="primary"
        size="large"
        disabled={isReviewDisabled}
        onPress={handleReview}
      >
        {ctaLabel}
      </Button>
    </Flex>
  )
}
