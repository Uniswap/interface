import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useDynamicFontSizing } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnAmountValidation, getEarnFiatPercentageInput } from 'uniswap/src/features/earn/amount'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/utils'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
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
  getWithdrawDestinationBalanceUsd,
  getWithdrawDestinationChainIds,
} from '~/features/earn/withdrawDestinationChains'
import { PredefinedAmount } from '~/pages/Swap/Buy/PredefinedAmount'

const CHAR_WIDTH = 45
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 24
const INPUT_MAX_WIDTH = 360
const FIAT_DECIMALS = 2

const PERCENT_OPTIONS = [0.25, 0.5, 0.75, 1] as const

interface WithdrawAmountViewProps {
  vault: EarnVaultInfo
  availableBalance: number
  initialAmount?: string
  initialChainId?: UniverseChainId
  onBack: () => void
  onClose: () => void
  onReview: (params: { amount: string; chainId: UniverseChainId; destinationCurrencyId: string }) => void
}

export function WithdrawAmountView({
  vault,
  availableBalance,
  initialAmount = '',
  initialChainId = UniverseChainId.Unichain,
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
    () => getWithdrawDestinationChainIds({ isTestnetModeEnabled }),
    [isTestnetModeEnabled],
  )
  const fallbackChainId = withdrawDestinationChainIds[0] ?? initialChainId

  // availableBalance is USD; convert to local fiat to match percent/over-balance/input.
  const availableBalanceLocal = convertFiatAmount(availableBalance).amount

  const [amount, setAmount] = useState(initialAmount)
  const [inputInFiat, setInputInFiat] = useState(true)
  const [selectedChainId, setSelectedChainId] = useState<UniverseChainId>(initialChainId)
  const chainId = withdrawDestinationChainIds.includes(selectedChainId) ? selectedChainId : fallbackChainId
  const activeAddresses = useActiveAddresses()
  const tieredNetworkOptions = useNetworkSelectorOptions({
    addresses: activeAddresses,
    chainIds: withdrawDestinationChainIds,
  })
  const destinationCurrencyId = getEarnVaultWithdrawDestinationCurrencyId({
    vault,
    destinationChainId: chainId,
  })
  const currencyInfo = useCurrencyInfo(destinationCurrencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''
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
  const convertUsdToLocalFiat = useCallback(
    (balanceUsd: number): number => convertFiatAmount(balanceUsd).amount,
    [convertFiatAmount],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const value = getEarnFiatPercentageInput({
        balanceUsd: availableBalance,
        convertUsdToLocalFiat,
        fiatDecimals: FIAT_DECIMALS,
        percentage: pct,
      })
      onSetFontSize(value)
      setAmount(value)
      setInputInFiat(true)
    },
    [availableBalance, convertUsdToLocalFiat, onSetFontSize],
  )

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

  const { isOverBalance, isReviewDisabled } = getEarnAmountValidation({
    availableAmount: availableBalanceLocal,
    comparisonAmount: inputAsLocalFiat,
    inputAmount: parsedAmount,
  })

  const selectedDestinationBalanceUsd = getWithdrawDestinationBalanceUsd({
    chainId,
    tieredNetworkOptions,
  })
  const balanceLabel = `${convertFiatAmountFormatted(selectedDestinationBalanceUsd ?? 0, NumberType.FiatStandard)} ${t(
    'explore.earn.deposit.available',
  )}`

  const ctaLabel =
    parsedAmount <= 0
      ? t('explore.earn.withdraw.enterAmount')
      : isOverBalance
        ? t('explore.earn.deposit.insufficientBalance')
        : t('common.button.review')

  const scaledInputWidth = useMemo(
    () => (amount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined),
    [amount, hiddenObserver.width],
  )

  const handleReview = useCallback(() => {
    const localFiat = inputInFiat ? amount : tokenToFiat(amount)
    if (localFiat === null) {
      return
    }
    onReview({ amount: localFiat, chainId, destinationCurrencyId })
  }, [amount, chainId, destinationCurrencyId, inputInFiat, onReview, tokenToFiat])

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

  const chainLabel = getChainInfo(chainId).label
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
                {currency?.name ?? 'USD Coin'}
              </Text>
              <Text variant="body3" color="$neutral2">
                {balanceLabel}
              </Text>
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
                <ChainLogo chainId={chainId} size={iconSizes.icon20} />
                <Text variant="body2" color="$neutral1">
                  {chainLabel}
                </Text>
              </Flex>
            }
          />
        </Flex>
      </Flex>

      <Button emphasis="primary" size="large" py="$spacing24" isDisabled={isReviewDisabled} onPress={handleReview}>
        {ctaLabel}
      </Button>
    </Flex>
  )
}
