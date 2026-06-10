import { isIOS } from '@universe/environment'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AmountEntrySection, DepositSourceRowContent } from 'src/components/earn/EarnDepositAmountControls'
import { Screen } from 'src/components/layout/Screen'
import { Button, Flex, Text, TouchableArea, useIsShortMobileDevice } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { PillMultiToggle } from 'uniswap/src/components/pill/PillMultiToggle'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnAmountValidation, getProjectedAnnualEarnings } from 'uniswap/src/features/earn/amount'
import { DEFAULT_WITHDRAW_CHAIN_ID } from 'uniswap/src/features/earn/constants'
import { useEarnAmountEntryMobile } from 'uniswap/src/features/earn/hooks/useEarnAmountEntryMobile'
import { useEarnDepositCurrencyContext } from 'uniswap/src/features/earn/hooks/useEarnDepositCurrencyContext'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  DecimalPadCalculatedSpaceId,
  DecimalPadCalculateSpace,
  DecimalPadInput,
  type DecimalPadInputRef,
} from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const MAX_INPUT_FONT_SIZE = 64
const MIN_INPUT_FONT_SIZE = 28
const MAX_CHAR_PIXEL_WIDTH = 40

// Review CTA height (44) + py spacing (16) — DecimalPadCalculateSpace needs to reserve this
// much vertical room above the numpad for the elements pinned to the bottom-of-screen.
const DECIMAL_PAD_EXTRA_ELEMENTS_HEIGHT = 60

function getFormattedAlternateAmount({
  isFiatInput,
  exactAmountFiat,
  exactAmountToken,
  symbol,
  fiatCurrencyInfo,
}: {
  isFiatInput: boolean
  exactAmountFiat: string
  exactAmountToken: string
  symbol: string
  fiatCurrencyInfo: FiatCurrencyInfo
}): string {
  if (isFiatInput) {
    return `${exactAmountToken || '0'} ${symbol}`
  }
  return `${fiatCurrencyInfo.symbol}${exactAmountFiat || '0'}`
}

function getCtaLabel({
  isOverBalance,
  hasAmount,
  t,
}: {
  isOverBalance: boolean
  hasAmount: boolean
  t: (key: string) => string
}): string {
  if (isOverBalance) {
    return t('explore.earn.deposit.insufficientBalance')
  }
  if (!hasAmount) {
    return t('common.noAmount.error')
  }
  return t('common.button.review')
}

export function EarnDepositAmountContent({
  vault,
  position,
  initialAction,
  initialChainId,
  initialAmount,
  initialSourceCurrencyId,
  onReview,
  onOpenNetworkSelector,
  onOpenDepositSourceSelector,
}: {
  vault: EarnVaultInfo
  position?: EarnPositionInfo
  initialAction?: EarnAction
  initialChainId?: UniverseChainId
  initialAmount?: string
  initialSourceCurrencyId?: string
  onReview: (params: {
    action: EarnAction
    amount: string
    chainId: UniverseChainId
    destinationCurrencyId: string
    sourceCurrencyId?: string
  }) => void
  onOpenNetworkSelector: (chainId: UniverseChainId) => void
  onOpenDepositSourceSelector: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const fiatCurrencyInfo = useAppFiatCurrencyInfo()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { isSheetReady } = useBottomSheetContext()

  const walletAddress = useActiveAccountAddress()
  const [currentAction, setCurrentAction] = useState<EarnAction>(initialAction ?? EarnAction.Deposit)
  const isWithdrawing = currentAction === EarnAction.Withdraw
  const chainId = initialChainId ?? DEFAULT_WITHDRAW_CHAIN_ID

  const { depositSourceOptions } = useEarnDepositSources({
    vault,
    walletAddress: walletAddress ?? undefined,
    initialSourceCurrencyId,
    skip: isWithdrawing,
  })

  // Derive from props rather than the hook's internal `selectedDepositSource`: the hook
  // seeds state only on mount, so it would ignore later `initialSourceCurrencyId` changes
  // merged in via `navigation.popTo` from the EarnDepositSourceSelector modal.
  const selectedDepositSource = useMemo(
    () =>
      depositSourceOptions.find(
        (option) =>
          initialSourceCurrencyId !== undefined &&
          areCurrencyIdsEqual(option.currencyInfo.currencyId, initialSourceCurrencyId),
      ) ?? depositSourceOptions.at(0),
    [depositSourceOptions, initialSourceCurrencyId],
  )

  const { currencyInfo, symbol, walletBalance, positionBalanceUsd, availableBalance, destinationCurrencyId } =
    useEarnDepositCurrencyContext({
      vault,
      position,
      isWithdrawing,
      selectedDepositSource,
      chainId,
    })
  const currency = currencyInfo?.currency

  const {
    value,
    exactValueRef,
    exactAmountFiat,
    exactAmountToken,
    isFiatInput,
    maxDecimals,
    parsedAmount,
    hasInputAmount,
    tokenComparisonAmount,
    localFiatComparisonAmount,
    setActiveAmount,
    handlePercentPress,
    handleToggleInputMode,
  } = useEarnAmountEntryMobile({
    currency,
    isWithdrawing,
    initialAmount,
    walletBalance,
    selectedDepositSourceBalanceUsd: selectedDepositSource?.balanceUsd,
    positionBalanceUsd,
  })

  const inputRef = useRef<RNTextInput>(null)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)
  const selectionRef = useRef<RNTextInputProps['selection']>(undefined)
  const [decimalPadReady, setDecimalPadReady] = useState(false)

  const {
    fontSize,
    onLayout: onInputLayout,
    onSetFontSize,
  } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
    maxFontSize: MAX_INPUT_FONT_SIZE,
    minFontSize: MIN_INPUT_FONT_SIZE,
  })

  useEffect(() => {
    onSetFontSize(value || '0')
  }, [onSetFontSize, value])

  const resetSelection = useCallback(({ start, end }: { start: number; end?: number }) => {
    selectionRef.current = { start, end }
  }, [])

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])
  const onTriggerInputShake = useCallback(() => undefined, [])

  const handleActionToggle = useCallback((action: string | number) => {
    setCurrentAction(action as EarnAction)
  }, [])

  const { hasAmount, isOverBalance, isReviewDisabled } = getEarnAmountValidation({
    availableAmount: availableBalance,
    comparisonAmount: isWithdrawing ? localFiatComparisonAmount : tokenComparisonAmount,
    hasRequiredSelection: isWithdrawing || selectedDepositSource !== undefined,
    inputAmount: parsedAmount,
    isConversionPending: !isFiatInput && hasInputAmount && !exactAmountFiat,
  })

  const projectedAnnualEarnings = getProjectedAnnualEarnings({
    balance: Number(exactAmountFiat) || 0,
    apyPercent: vault.apyPercent,
  })

  const formatFiat = useCallback(
    (val: number): string => formatNumberOrString({ value: val, type: NumberType.FiatStandard }),
    [formatNumberOrString],
  )

  const availableLabel = useMemo(() => {
    const formatted = formatNumberOrString({
      value: availableBalance,
      type: isWithdrawing ? NumberType.FiatStandard : NumberType.TokenNonTx,
    })
    return `${formatted} ${t('explore.earn.deposit.available')}`
  }, [availableBalance, isWithdrawing, formatNumberOrString, t])

  const chainLabel = useMemo(() => getChainInfo(chainId).label, [chainId])

  const formattedAlternateAmount = getFormattedAlternateAmount({
    isFiatInput,
    exactAmountFiat,
    exactAmountToken,
    symbol,
    fiatCurrencyInfo,
  })
  const ctaLabel = getCtaLabel({ isOverBalance, hasAmount, t })
  const apyLabel = t('explore.earn.vault.rateValue', {
    apy: formatPercent(vault.apyPercent),
  })
  const shouldShowDepositSourceSelector = !isWithdrawing && depositSourceOptions.length > 1

  const handleReview = useCallback(() => {
    onReview({
      action: currentAction,
      amount: exactAmountFiat,
      chainId: isWithdrawing ? chainId : (selectedDepositSource?.chainId ?? vault.chainId),
      destinationCurrencyId,
      sourceCurrencyId: selectedDepositSource?.currencyInfo.currencyId,
    })
  }, [
    chainId,
    currentAction,
    destinationCurrencyId,
    exactAmountFiat,
    isWithdrawing,
    onReview,
    selectedDepositSource,
    vault.chainId,
  ])

  return (
    // `row` + inner `width="100%"` is what gives DecimalPadCalculateSpace real height
    // (default `alignItems: stretch` on the row stretches the inner column vertically).
    <Screen edges={['top', 'bottom']}>
      <HandleBar backgroundColor="none" />
      <Flex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing16" px="$spacing24" width="100%">
            <Flex row alignItems="center" justifyContent="center">
              <PillMultiToggle
                defaultOption={currentAction}
                options={[
                  { value: EarnAction.Deposit, display: t('common.deposit') },
                  { value: EarnAction.Withdraw, display: t('common.withdraw') },
                ]}
                onSelectOption={handleActionToggle}
              />
              <Flex position="absolute" right={0} top="$spacing6">
                {/* TODO(CONS-1889): wire info tooltip explaining the deposit flow. */}
                <InfoCircleFilled color="$neutral3" size="$icon.20" />
              </Flex>
            </Flex>

            <AmountEntrySection
              fiatCurrencyInfo={fiatCurrencyInfo}
              fontSize={fontSize}
              formattedAlternateAmount={formattedAlternateAmount}
              hasAmount={hasAmount}
              inputRef={inputRef}
              isFiatInput={isFiatInput}
              maxDecimals={maxDecimals}
              maxLabel={t('common.max')}
              setActiveAmount={setActiveAmount}
              symbol={symbol}
              value={value}
              onInputLayout={onInputLayout}
              onPercentPress={handlePercentPress}
              onToggleInputMode={handleToggleInputMode}
            />

            {!isWithdrawing && (
              <Flex row alignItems="center" justifyContent="space-between">
                <Text color="$accent1" variant="body3">
                  {apyLabel}
                </Text>
                <Text color={hasAmount ? '$statusSuccess' : '$neutral2'} variant="body3">
                  {`+${formatFiat(projectedAnnualEarnings)} `}
                  <Text color="$neutral2" variant="body3">
                    {t('explore.earn.deposit.perYear')}
                  </Text>
                </Text>
              </Flex>
            )}

            {shouldShowDepositSourceSelector ? (
              <TouchableArea
                backgroundColor="$surface1"
                borderColor="$surface3"
                borderRadius="$rounded20"
                borderWidth="$spacing1"
                p="$spacing16"
                onPress={onOpenDepositSourceSelector}
              >
                <DepositSourceRowContent
                  showChevron
                  apyLabel={apyLabel}
                  availableLabel={availableLabel}
                  currencyInfo={currencyInfo}
                  isWithdrawing={isWithdrawing}
                />
              </TouchableArea>
            ) : (
              <Flex
                backgroundColor="$surface1"
                borderColor="$surface3"
                borderRadius="$rounded20"
                borderWidth="$spacing1"
                p="$spacing16"
              >
                <DepositSourceRowContent
                  apyLabel={apyLabel}
                  availableLabel={availableLabel}
                  currencyInfo={currencyInfo}
                  isWithdrawing={isWithdrawing}
                />
              </Flex>
            )}

            {isWithdrawing && (
              <TouchableArea onPress={() => onOpenNetworkSelector(chainId)}>
                <Flex
                  row
                  alignItems="center"
                  justifyContent="space-between"
                  backgroundColor="$surface1"
                  borderColor="$surface3"
                  borderRadius="$rounded20"
                  borderWidth="$spacing1"
                  px="$spacing16"
                  py="$spacing12"
                >
                  <Text color="$neutral2" variant="body2">
                    {t('explore.earn.withdraw.to')}
                  </Text>
                  <Flex row alignItems="center" gap="$spacing6">
                    <NetworkLogo chainId={chainId} size={iconSizes.icon20} />
                    <Text color="$neutral1" variant="body2">
                      {chainLabel}
                    </Text>
                    <RotatableChevron color="$neutral3" direction="end" size="$icon.16" />
                  </Flex>
                </Flex>
              </TouchableArea>
            )}

            <DecimalPadCalculateSpace
              id={DecimalPadCalculatedSpaceId.EarnDeposit}
              decimalPadRef={decimalPadRef}
              additionalElementsHeight={DECIMAL_PAD_EXTRA_ELEMENTS_HEIGHT}
              isDecimalPadReady={decimalPadReady}
            />

            <AnimatedFlex
              bottom={0}
              gap={isShortMobileDevice ? 0 : '$spacing8'}
              left={0}
              opacity={decimalPadReady ? 1 : 0}
              pb={isShortMobileDevice && isIOS ? '$spacing4' : '$spacing24'}
              position="absolute"
              px="$spacing24"
              right={0}
            >
              <Flex grow justifyContent="flex-end" py="$spacing8">
                <DecimalPadInput
                  ref={decimalPadRef}
                  maxDecimals={maxDecimals}
                  resetSelection={resetSelection}
                  selectionRef={selectionRef}
                  setValue={setActiveAmount}
                  valueRef={exactValueRef}
                  onReady={onDecimalPadReady}
                  onTriggerInputShakeAnimation={onTriggerInputShake}
                />
              </Flex>
              <Button emphasis="primary" size="large" isDisabled={isReviewDisabled} onPress={handleReview}>
                {ctaLabel}
              </Button>
            </AnimatedFlex>
          </AnimatedFlex>
        )}
      </Flex>
    </Screen>
  )
}
