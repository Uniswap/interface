import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, TouchableArea, useDynamicFontSizing } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { ChainLogo } from '~/components/Logo/ChainLogo'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import type { MockEarnVault } from '~/features/earn/_fixtures/vaults'
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

// TODO(CONS-1787): drive from the chains supported by the withdraw quote endpoint.
const WITHDRAW_DESTINATION_CHAIN_IDS: UniverseChainId[] = [UniverseChainId.Unichain, UniverseChainId.Mainnet]
export const DEFAULT_WITHDRAW_CHAIN_ID = WITHDRAW_DESTINATION_CHAIN_IDS[0]

interface WithdrawAmountViewProps {
  vault: MockEarnVault
  availableBalance: number
  initialAmount?: string
  initialChainId?: UniverseChainId
  onBack: () => void
  onClose: () => void
  onReview: (params: { amount: string; chainId: UniverseChainId }) => void
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
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(vault.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? 'USDC'

  const [amount, setAmount] = useState(initialAmount)
  const [inputInFiat, setInputInFiat] = useState(true)
  const [chainId, setChainId] = useState<UniverseChainId>(initialChainId)
  const inputRef = useRef<HTMLInputElement>(null)
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
      onSetFontSize(value)
      setAmount(value)
    },
    [onSetFontSize],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      const value = (availableBalance * pct).toFixed(FIAT_DECIMALS)
      onSetFontSize(value)
      setAmount(value)
      setInputInFiat(true)
    },
    [availableBalance, onSetFontSize],
  )

  const parsedAmount = Number(amount) || 0
  const isOverBalance = parsedAmount > availableBalance
  const isReviewDisabled = parsedAmount <= 0 || isOverBalance

  const balanceLabel = `${formatNumberOrString({ value: availableBalance, type: NumberType.FiatStandard })} ${t(
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
    onReview({ amount, chainId })
  }, [amount, chainId, onReview])

  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const handleToggleInputUnit = useCallback(() => setInputInFiat((prev) => !prev), [])

  const handleNetworkChange = useCallback((next: UniverseChainId | undefined) => {
    if (next) {
      setChainId(next)
    }
  }, [])

  const chainLabel = getChainInfo(chainId).label

  return (
    <Flex gap="$spacing16">
      <Flex row alignItems="center" justifyContent="space-between">
        <TouchableArea onPress={onBack} hoverable>
          <BackArrow color="$neutral2" size="$icon.24" />
        </TouchableArea>
        <Text variant="body2" color="$neutral1">
          {t('explore.earn.withdraw.title')}
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
                <NumericalInputSymbolContainer showPlaceholder={!amount} $fontSize={fontSize}>
                  $
                </NumericalInputSymbolContainer>
              )}
            </Flex>
            <StyledNumericalInput
              value={amount}
              onUserInput={handleUserInput}
              placeholder="0"
              $width={scaledInputWidth}
              $fontSize={fontSize}
              $hasPrefix={inputInFiat}
              maxDecimals={FIAT_DECIMALS}
              ref={inputRef}
            />
            <NumericalInputMimic ref={hiddenObserver.ref} $fontSize={fontSize}>
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
                {currency?.name ?? 'USD Coin'}
              </Text>
              <Text variant="body3" color="$neutral2">
                {balanceLabel}
              </Text>
            </Flex>
          </Flex>
          <Text variant="body3" color="$accent1">
            {t('explore.earn.vault.rateValue', { apy: formatPercent(vault.apyPercent) })}
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
            networks={WITHDRAW_DESTINATION_CHAIN_IDS}
            currentChainId={chainId}
            isTriggerStyled={false}
            showMultichainOption={false}
            position="right"
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
