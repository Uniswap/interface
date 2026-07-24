import { TradingApi } from '@universe/api'
import { isIOS } from '@universe/environment'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import {
  AmountEntrySection,
  EarnHelpIconButton,
  getFormattedAlternateAmount,
} from 'src/components/earn/EarnDepositAmountControls'
import {
  EarnDepositLookupState,
  EarnDepositSourceSection,
  EarnProjectedEarningsRow,
  EarnWithdrawDestinationSection,
} from 'src/components/earn/EarnDepositAmountSections'
import {
  getEarnDepositAmountUiState,
  getHasRequiredSelection,
  getIsEarnAmountConversionPending,
} from 'src/components/earn/earnDepositAmountUiState'
import { resolveMobileEarnAmountDestination } from 'src/components/earn/earnWithdrawDestination'
import { useEarnAmountInputFontSizing } from 'src/components/earn/useEarnAmountInputFontSizing'
import { useEarnDepositAmountInlineErrors } from 'src/components/earn/useEarnDepositAmountInlineErrors'
import { Screen } from 'src/components/layout/Screen'
import { useLayoutHeight } from 'src/utils/useLayoutHeight'
import { Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { PillMultiToggle } from 'uniswap/src/components/pill/PillMultiToggle'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnAmountValidation, getProjectedAnnualEarnings } from 'uniswap/src/features/earn/amount'
import { useEarnMinDepositUsd } from 'uniswap/src/features/earn/config'
import { DEFAULT_WITHDRAW_CHAIN_ID } from 'uniswap/src/features/earn/constants'
import { useEarnAmountEntryMobile } from 'uniswap/src/features/earn/hooks/useEarnAmountEntryMobile'
import { useEarnDepositCurrencyContext } from 'uniswap/src/features/earn/hooks/useEarnDepositCurrencyContext'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { EarnAction, type EarnPositionInfo, type EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { hasConfirmedEarnPositionRawBalance } from 'uniswap/src/features/earn/utils'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
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

export function EarnDepositAmountContent({
  vault,
  position,
  initialAction,
  initialChainId,
  initialAmount,
  initialSourceCurrencyId,
  initialWithdrawMode,
  minimumBalanceDataUpdatedAtMs,
  onReview,
  onOpenVaultDetails,
  onOpenNetworkSelector,
  onOpenDepositSourceSelector,
}: {
  vault: EarnVaultInfo
  position?: EarnPositionInfo
  initialAction?: EarnAction
  initialChainId?: UniverseChainId
  initialAmount?: string
  initialSourceCurrencyId?: string
  initialWithdrawMode?: TradingApi.EarnWithdrawMode
  minimumBalanceDataUpdatedAtMs?: number
  onReview: (params: {
    action: EarnAction
    amount: string
    tokenAmount?: string
    chainId: UniverseChainId
    destinationCurrencyId?: string
    sourceCurrencyId?: string
    withdrawMode?: TradingApi.EarnWithdrawMode
  }) => void
  onOpenVaultDetails: () => void
  onOpenNetworkSelector: (chainId: UniverseChainId) => void
  onOpenDepositSourceSelector: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmount, formatNumberOrString, formatPercent } = useLocalizationContext()
  const minDepositUsd = useEarnMinDepositUsd()
  const fiatCurrencyInfo = useAppFiatCurrencyInfo()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { isSheetReady } = useBottomSheetContext()

  const walletAddress = useActiveAccountAddress()
  const [currentAction, setCurrentAction] = useState<EarnAction>(initialAction ?? EarnAction.Deposit)
  const [withdrawMode, setWithdrawMode] = useState<TradingApi.EarnWithdrawMode>(
    initialWithdrawMode ?? TradingApi.EarnWithdrawMode.EXACT_ASSETS,
  )
  const previousInitialWithdrawModeRef = useRef(initialWithdrawMode)
  const isWithdrawing = currentAction === EarnAction.Withdraw
  const requestedChainId = initialChainId ?? DEFAULT_WITHDRAW_CHAIN_ID
  const { chainId, destinationCurrencyId: resolvedWithdrawDestinationCurrencyId } = useMemo(
    () => resolveMobileEarnAmountDestination({ isWithdrawing, requestedChainId, vault }),
    [isWithdrawing, requestedChainId, vault],
  )

  const {
    balanceLookupErrored,
    balanceLookupHasData,
    balanceLookupSettled,
    depositSourceOptions,
    refetchBalanceLookup,
  } = useEarnDepositSources({
    vault,
    walletAddress: walletAddress ?? undefined,
    initialSourceCurrencyId,
    minimumBalanceDataUpdatedAtMs,
    skip: isWithdrawing,
  })

  const selectedDepositSource = useMemo(
    () =>
      depositSourceOptions.find(
        (option) =>
          initialSourceCurrencyId !== undefined &&
          areCurrencyIdsEqual(option.currencyInfo.currencyId, initialSourceCurrencyId),
      ) ?? depositSourceOptions.at(0),
    [depositSourceOptions, initialSourceCurrencyId],
  )

  const {
    currencyInfo,
    symbol,
    walletBalance,
    withdrawableBalanceUsd,
    availableBalance,
    isWithdrawLiquidityLimited,
    destinationCurrencyId: contextDestinationCurrencyId,
  } = useEarnDepositCurrencyContext({
    vault,
    position,
    isWithdrawing,
    selectedDepositSource,
    chainId,
  })
  const destinationCurrencyId = isWithdrawing ? resolvedWithdrawDestinationCurrencyId : contextDestinationCurrencyId
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
    isMaxSelected,
    setActiveAmount: setEntryActiveAmount,
    handlePercentPress: handleEntryPercentPress,
    handleToggleInputMode,
    resetAmounts,
  } = useEarnAmountEntryMobile({
    currency,
    isWithdrawing,
    initialAmount,
    walletBalance,
    walletBalanceRaw: selectedDepositSource?.balanceRaw,
    selectedDepositSourceBalanceUsd: selectedDepositSource?.balanceUsd,
    withdrawableBalanceUsd,
    isWithdrawLiquidityLimited,
  })

  const inputRef = useRef<RNTextInput>(null)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)
  const selectionRef = useRef<RNTextInputProps['selection']>(undefined)
  const [decimalPadReady, setDecimalPadReady] = useState(false)
  const [amountSectionHeight, onAmountSectionLayout] = useLayoutHeight()
  const [decimalPadHeight, onDecimalPadLayout] = useLayoutHeight()
  const [bottomControlsHeight, onBottomControlsLayout] = useLayoutHeight()

  const { fontSize, onInputLayout } = useEarnAmountInputFontSizing({
    fiatSymbol: fiatCurrencyInfo.symbol,
    isFiatInput,
    symbol,
    value,
  })

  const resetSelection = useCallback(({ start, end }: { start: number; end?: number }) => {
    selectionRef.current = { start, end }
  }, [])

  // Refresh cached key state after programmatic value changes, mirroring the swap/send/FOR screens.
  useEffect(() => {
    resetSelection({ start: value.length, end: value.length })
    decimalPadRef.current?.updateDisabledKeys()
  }, [value, resetSelection])

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])
  const onTriggerInputShake = useCallback(() => undefined, [])
  useEffect(() => {
    if (previousInitialWithdrawModeRef.current === initialWithdrawMode) {
      return
    }
    previousInitialWithdrawModeRef.current = initialWithdrawMode
    setWithdrawMode(initialWithdrawMode ?? TradingApi.EarnWithdrawMode.EXACT_ASSETS)
  }, [initialWithdrawMode])
  useEffect(() => {
    if (isWithdrawLiquidityLimited && withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES) {
      setWithdrawMode(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
    }
  }, [isWithdrawLiquidityLimited, withdrawMode])

  const handleActionToggle = useCallback(
    (action: string | number) => {
      const nextAction = action as EarnAction
      if (nextAction === currentAction) {
        return
      }
      setCurrentAction(nextAction)
      resetAmounts()
      resetSelection({ start: 0 })
      decimalPadRef.current?.updateDisabledKeys()
      if (nextAction === EarnAction.Deposit) {
        setWithdrawMode(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
      }
    },
    [currentAction, resetAmounts, resetSelection],
  )

  const setActiveAmount = useCallback(
    (next: string) => {
      if (isWithdrawing) {
        setWithdrawMode(TradingApi.EarnWithdrawMode.EXACT_ASSETS)
      }
      setEntryActiveAmount(next)
    },
    [isWithdrawing, setEntryActiveAmount],
  )

  const handlePercentPress = useCallback(
    (pct: number) => {
      if (isWithdrawing) {
        setWithdrawMode(
          pct === 1 && !isWithdrawLiquidityLimited
            ? TradingApi.EarnWithdrawMode.MAX_SHARES
            : TradingApi.EarnWithdrawMode.EXACT_ASSETS,
        )
      }
      handleEntryPercentPress(pct)
    },
    [handleEntryPercentPress, isWithdrawLiquidityLimited, isWithdrawing],
  )
  const isConversionPending = getIsEarnAmountConversionPending({ exactAmountFiat, hasInputAmount, isFiatInput })
  const hasConfirmedWithdrawPosition = hasConfirmedEarnPositionRawBalance(position)
  const { hasAmount, isOverBalance, isReviewDisabled } = getEarnAmountValidation({
    availableAmount: availableBalance,
    comparisonAmount: isWithdrawing ? localFiatComparisonAmount : tokenComparisonAmount,
    hasRequiredSelection: getHasRequiredSelection({
      hasConfirmedWithdrawPosition,
      hasCurrency: currency !== undefined,
      hasDestinationCurrency: destinationCurrencyId !== undefined,
      hasSelectedDepositSource: selectedDepositSource !== undefined,
      isWithdrawing,
    }),
    inputAmount: parsedAmount,
    isConversionPending,
    skipOverBalanceCheck: isWithdrawing
      ? withdrawMode === TradingApi.EarnWithdrawMode.MAX_SHARES && !isWithdrawLiquidityLimited
      : isMaxSelected,
  })
  const formatFiat = useCallback(
    (val: number): string => formatNumberOrString({ value: val, type: NumberType.FiatStandard }),
    [formatNumberOrString],
  )
  const minimumDepositLocalFiat = convertFiatAmount(minDepositUsd).amount
  const { debouncedIsOverWithdrawableLiquidity, isBelowMinimumDeposit, showMinimumDepositInlineError } =
    useEarnDepositAmountInlineErrors({
      exactAmountFiat,
      hasInputAmount,
      isConversionPending,
      isOverBalance,
      isWithdrawLiquidityLimited,
      isWithdrawing,
      minimumDepositLocalFiat,
    })
  const withdrawLiquidityAvailableAmount = formatFiat(availableBalance)
  const withdrawLiquidityTotalAmount = formatFiat(convertFiatAmount(position?.depositedUsd ?? 0).amount)
  const isOverWithdrawableLiquidity = isWithdrawing && isWithdrawLiquidityLimited && isOverBalance
  const amountUiState = getEarnDepositAmountUiState({
    formatNumberOrString,
    hasAmount,
    hasConfirmedWithdrawPosition,
    isBelowMinimumDeposit,
    isOverBalance,
    isOverWithdrawableLiquidity,
    isReviewDisabled,
    isWithdrawing,
    minimumDepositLocalFiat,
    showOverWithdrawableLiquidityInlineError: debouncedIsOverWithdrawableLiquidity,
    showMinimumDepositInlineError,
    t,
    withdrawLiquidityAvailableAmount,
  })
  const projectedAnnualEarnings = getProjectedAnnualEarnings({
    balance: Number(exactAmountFiat) || 0,
    apyPercent: vault.apyPercent,
  })
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
    currencyCode: fiatCurrencyInfo.code,
    formatNumberOrString,
  })
  const apyLabel = t('explore.earn.vault.rateValue', {
    apy: formatPercent(vault.apyPercent, 2),
  })
  const shouldShowDepositSourceSelector = !isWithdrawing && depositSourceOptions.length > 1
  const showDepositSourceLookupError = !isWithdrawing && balanceLookupErrored && !balanceLookupHasData
  const showDepositSourceLookupLoader = !isWithdrawing && !balanceLookupSettled && !showDepositSourceLookupError
  const handleReview = useCallback(() => {
    if (isWithdrawing && !hasConfirmedWithdrawPosition) {
      return
    }
    if (isWithdrawing && !destinationCurrencyId) {
      return
    }

    onReview({
      action: currentAction,
      amount: exactAmountFiat,
      tokenAmount: !isWithdrawing && isMaxSelected ? exactAmountToken : undefined,
      chainId: isWithdrawing ? chainId : (selectedDepositSource?.chainId ?? vault.chainId),
      destinationCurrencyId,
      sourceCurrencyId: selectedDepositSource?.currencyInfo.currencyId,
      withdrawMode: isWithdrawing ? withdrawMode : undefined,
    })
  }, [
    chainId,
    currentAction,
    destinationCurrencyId,
    exactAmountFiat,
    exactAmountToken,
    hasConfirmedWithdrawPosition,
    isMaxSelected,
    isWithdrawing,
    onReview,
    selectedDepositSource,
    vault.chainId,
    withdrawMode,
  ])

  return (
    <Screen edges={['top', 'bottom']}>
      <HandleBar backgroundColor="none" />
      <Flex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing8" px="$spacing24" width="100%">
            <Flex row alignItems="center" justifyContent="center">
              <PillMultiToggle
                defaultOption={currentAction}
                options={[
                  { value: EarnAction.Deposit, display: t('common.deposit') },
                  { value: EarnAction.Withdraw, display: t('common.withdraw') },
                ]}
                onSelectOption={handleActionToggle}
              />
              <EarnHelpIconButton onPress={onOpenVaultDetails} />
            </Flex>

            <EarnDepositLookupState
              isError={showDepositSourceLookupError}
              isLoading={showDepositSourceLookupLoader}
              onRetry={refetchBalanceLookup}
            >
              <>
                <Flex fill justifyContent="center" pb={bottomControlsHeight}>
                  <Flex onLayout={onAmountSectionLayout}>
                    <AmountEntrySection
                      fiatCurrencyInfo={fiatCurrencyInfo}
                      fontSize={fontSize}
                      formattedAlternateAmount={formattedAlternateAmount}
                      hasAmount={hasAmount}
                      inlineError={amountUiState.inlineError}
                      inputRef={inputRef}
                      isFiatInput={isFiatInput}
                      isShortMobileDevice={isShortMobileDevice}
                      maxDecimals={maxDecimals}
                      maxLabel={t('common.max')}
                      setActiveAmount={setActiveAmount}
                      symbol={symbol}
                      value={value}
                      onInputLayout={onInputLayout}
                      onPercentPress={handlePercentPress}
                      onToggleInputMode={handleToggleInputMode}
                    />
                  </Flex>
                  <Flex position="absolute" top={0} right={0} bottom={0} left={0} pointerEvents="none">
                    {/* The spacer overlays the full content area, so the pad ceiling must exclude the amount
                        section and the overlay's non-pad chrome (bottomControls − pad, pad-size-invariant). */}
                    <DecimalPadCalculateSpace
                      id={DecimalPadCalculatedSpaceId.EarnDeposit}
                      decimalPadRef={decimalPadRef}
                      additionalElementsHeight={
                        amountSectionHeight + Math.max(0, bottomControlsHeight - decimalPadHeight)
                      }
                      isDecimalPadReady={decimalPadReady}
                    />
                  </Flex>
                </Flex>

                <AnimatedFlex
                  bottom={0}
                  gap={isShortMobileDevice ? 0 : '$spacing8'}
                  left={0}
                  opacity={decimalPadReady ? 1 : 0}
                  pb={isShortMobileDevice && isIOS ? '$spacing4' : '$spacing24'}
                  position="absolute"
                  px="$spacing24"
                  right={0}
                  onLayout={onBottomControlsLayout}
                >
                  <Flex gap="$spacing8">
                    {!isWithdrawing && (
                      <EarnProjectedEarningsRow
                        apyLabel={apyLabel}
                        hasAmount={hasAmount}
                        perYearLabel={t('explore.earn.deposit.perYear')}
                        projectedAnnualEarningsLabel={formatFiat(projectedAnnualEarnings)}
                      />
                    )}

                    <EarnDepositSourceSection
                      apyLabel={apyLabel}
                      availableLabel={availableLabel}
                      currencyInfo={currencyInfo}
                      isWithdrawing={isWithdrawing}
                      lowLiquidityAvailableAmount={withdrawLiquidityAvailableAmount}
                      lowLiquidityTotalAmount={withdrawLiquidityTotalAmount}
                      showLowLiquidityInfo={isWithdrawing && isWithdrawLiquidityLimited}
                      showSelector={shouldShowDepositSourceSelector}
                      onOpenDepositSourceSelector={onOpenDepositSourceSelector}
                    />

                    <EarnWithdrawDestinationSection
                      chainId={chainId}
                      chainLabel={chainLabel}
                      isVisible={isWithdrawing}
                      withdrawToLabel={t('explore.earn.withdraw.to')}
                      onOpenNetworkSelector={onOpenNetworkSelector}
                    />
                  </Flex>
                  <Flex grow justifyContent="flex-end" py="$spacing8">
                    <Flex onLayout={onDecimalPadLayout}>
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
                  </Flex>
                  <Button
                    emphasis="primary"
                    size="large"
                    disabled={amountUiState.isReviewDisabled}
                    onPress={handleReview}
                  >
                    {amountUiState.ctaLabel}
                  </Button>
                </AnimatedFlex>
              </>
            </EarnDepositLookupState>
          </AnimatedFlex>
        )}
      </Flex>
    </Screen>
  )
}
