/* eslint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { D3LiquidityRangeInput } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeInput'
import { LiquidityRangeInput } from 'components/Charts/LiquidityRangeInput/LiquidityRangeInput'
import { useDefaultInitialPrice } from 'components/Liquidity/Create/hooks/useDefaultInitialPrice'
import { useTokenControlOptions } from 'components/Liquidity/Create/hooks/useTokenControlOptions'
import { PoolOutOfSyncError } from 'components/Liquidity/Create/PoolOutOfSyncError'
import { PositionOutOfRangeError } from 'components/Liquidity/Create/PositionOutOfRangeError'
import { RangeAmountInput, RangeSelectionInput } from 'components/Liquidity/Create/RangeAmountInput'
import { PriceRangeState } from 'components/Liquidity/Create/types'
import { DisplayCurrentPrice } from 'components/Liquidity/DisplayCurrentPrice'
import { PositionInfo } from 'components/Liquidity/types'
import { getBaseAndQuoteCurrencies } from 'components/Liquidity/utils/currency'
import { getPriceDifference } from 'components/Liquidity/utils/getPriceDifference'
import { isInvalidPrice, isInvalidRange } from 'components/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useRangeHopCallbacks } from 'state/mint/v3/hooks'
import { tryParsePrice } from 'state/mint/v3/utils'
import { PositionField } from 'types/position'
import { AnimatePresence, Button, Flex, SegmentedControl, Text, useMedia, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { fonts, zIndexes } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

const InitialPriceInput = () => {
  const [otherCurrencyPrice, setOtherCurrencyPrice] = useState<string | undefined>()

  const media = useMedia()
  const colors = useSporeColors()

  const {
    creatingPoolOrPair,
    currencies,
    protocolVersion,
    priceRangeState: { initialPrice, priceInverted, isInitialPriceDirty },
    setPriceRangeState,
  } = useCreateLiquidityContext()

  const { price: defaultInitialPrice, isLoading: isDefaultInitialPriceLoading } = useDefaultInitialPrice({
    currencies: {
      [PositionField.TOKEN0]: currencies.display.TOKEN0,
      [PositionField.TOKEN1]: currencies.display.TOKEN1,
    },
    // V2 create flow doesn't show the liquidity range chart so we always want
    // to get the default initial price for DisplayCurrentPrice in deposit step
    skip: !creatingPoolOrPair && protocolVersion === ProtocolVersion.V2,
  })

  const formattedDefaultInitialPrice = useMemo(() => {
    if (!defaultInitialPrice) {
      return ''
    }

    return priceInverted ? defaultInitialPrice.invert().toSignificant(8) : defaultInitialPrice.toSignificant(8)
  }, [defaultInitialPrice, priceInverted])

  const priceDifference = useMemo(
    () =>
      getPriceDifference({
        initialPrice,
        defaultInitialPrice,
        priceInverted,
      }),
    [initialPrice, defaultInitialPrice, priceInverted],
  )

  useEffect(() => {
    if (formattedDefaultInitialPrice && !isInitialPriceDirty) {
      setPriceRangeState((prevState) => ({
        ...prevState,
        initialPrice: formattedDefaultInitialPrice,
      }))
    }
  }, [formattedDefaultInitialPrice, isInitialPriceDirty, setPriceRangeState])

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceInverted)
  // biome-ignore lint/correctness/useExhaustiveDependencies: +priceInverted
  useEffect(() => {
    try {
      if (initialPrice && baseCurrency && quoteCurrency) {
        const parsedPrice = tryParsePrice({
          baseToken: baseCurrency,
          quoteToken: quoteCurrency,
          value: initialPrice,
        })
        setOtherCurrencyPrice(parsedPrice?.invert().toSignificant(8))
      }
    } catch {
      setOtherCurrencyPrice(undefined)
    }
  }, [baseCurrency, quoteCurrency, initialPrice, priceInverted])

  const { TOKEN0, TOKEN1 } = currencies.display
  const controlOptions = useTokenControlOptions([TOKEN0, TOKEN1], 'large')

  const handleSelectInitialPriceBaseToken = useCallback(
    (option: string) => {
      if (option === TOKEN0?.symbol) {
        setPriceRangeState((prevState) => ({
          ...prevState,
          priceInverted: false,
          initialPrice: otherCurrencyPrice ?? '',
        }))
      } else {
        setPriceRangeState((prevState) => ({
          ...prevState,
          priceInverted: true,
          initialPrice: otherCurrencyPrice ?? '',
        }))
      }
    },
    [TOKEN0?.symbol, otherCurrencyPrice, setPriceRangeState],
  )

  const handleUseMarketPrice = useCallback(() => {
    setPriceRangeState((prevState) => ({
      ...prevState,
      initialPrice: formattedDefaultInitialPrice,
    }))
  }, [formattedDefaultInitialPrice, setPriceRangeState])

  return (
    <Flex gap="$spacing12">
      <Flex row justifyContent="space-between">
        <Flex shrink gap="$spacing4">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.initialPrice.set" />
          </Text>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="position.initialPrice.info" />
          </Text>
        </Flex>
      </Flex>
      <Flex gap="$spacing4">
        <Flex
          backgroundColor="$surface2"
          p="$spacing16"
          gap="$spacing6"
          borderTopLeftRadius="$rounded16"
          borderTopRightRadius="$rounded16"
        >
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body3" color="$neutral2">
              <Trans i18nKey="position.initialPrice" />
            </Text>
            {media.sm && (
              <SegmentedControl
                options={controlOptions}
                selectedOption={baseCurrency?.symbol ?? ''}
                onSelectOption={handleSelectInitialPriceBaseToken}
                size="smallThumbnail"
              />
            )}
          </Flex>
          <Flex row alignItems="center" justifyContent="space-between">
            <AmountInput
              backgroundColor="$transparent"
              borderWidth="$none"
              borderRadius="$none"
              fontFamily="$heading"
              color={
                priceDifference?.warning === WarningSeverity.Medium
                  ? '$statusWarning'
                  : priceDifference?.warning === WarningSeverity.High
                    ? '$statusCritical'
                    : '$neutral1'
              }
              fontSize={fonts.heading2.fontSize}
              fontWeight={fonts.heading2.fontWeight}
              lineHeight={fonts.heading2.lineHeight}
              overflow="visible"
              placeholder="0"
              placeholderTextColor={colors.neutral3.val}
              px="$none"
              py="$none"
              value={initialPrice}
              onChangeText={(text) =>
                setPriceRangeState((prev) => ({
                  ...prev,
                  initialPrice: text,
                  isInitialPriceDirty: true,
                }))
              }
            />
            {!media.sm && (
              <SegmentedControl
                options={controlOptions}
                selectedOption={baseCurrency?.symbol ?? ''}
                onSelectOption={handleSelectInitialPriceBaseToken}
                size="largeThumbnail"
              />
            )}
          </Flex>
          <Flex row $sm={{ row: false, alignItems: 'flex-start' }} alignItems="center" justifyContent="space-between">
            <Text variant="body2" color="$neutral2" $md={{ variant: 'body3' }} flexShrink={0}>
              {quoteCurrency?.symbol} = 1 {baseCurrency?.symbol}
            </Text>
            <AnimatePresence>
              {priceDifference?.warning && (
                <Flex
                  row
                  alignItems="center"
                  gap="$spacing4"
                  animation="fast"
                  exitStyle={{ opacity: 0 }}
                  enterStyle={{ opacity: 0 }}
                >
                  <AlertTriangleFilled
                    size={16}
                    color={priceDifference.warning === WarningSeverity.Medium ? '$statusWarning' : '$statusCritical'}
                  />

                  <Text
                    variant="body3"
                    color={priceDifference.warning === WarningSeverity.Medium ? '$statusWarning' : '$statusCritical'}
                  >
                    {priceDifference.value < 0 ? (
                      <Trans
                        i18nKey="position.initialPrice.difference.negative"
                        values={{ value: priceDifference.absoluteValue }}
                      />
                    ) : (
                      <Trans
                        i18nKey="position.initialPrice.difference.positive"
                        values={{ value: priceDifference.absoluteValue }}
                      />
                    )}
                  </Text>
                </Flex>
              )}
            </AnimatePresence>
          </Flex>
        </Flex>
        <Flex
          row
          backgroundColor="$surface2"
          py="$spacing12"
          px="$spacing16"
          borderBottomLeftRadius="$rounded16"
          borderBottomRightRadius="$rounded16"
          justifyContent="space-between"
          alignItems="center"
        >
          <DisplayCurrentPrice
            isLoading={isDefaultInitialPriceLoading}
            price={priceInverted ? defaultInitialPrice?.invert() : defaultInitialPrice}
          />
          {defaultInitialPrice && (
            <Flex>
              <Button
                isDisabled={priceDifference?.absoluteValue ? priceDifference.absoluteValue === 0 : !!initialPrice}
                variant="default"
                emphasis="secondary"
                size="xxsmall"
                py="$spacing12"
                px="$spacing8"
                onPress={handleUseMarketPrice}
              >
                <Trans i18nKey="position.initialPrice.useMarketPrice" />
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}

function RangeControl({ value, active }: { value: string; active: boolean }) {
  return (
    <Text color={active ? '$neutral1' : '$neutral2'} userSelect="none" variant="buttonLabel3">
      {value}
    </Text>
  )
}

export const SelectPriceRangeStep = ({
  positionInfo,
  onContinue,
  disableContinue,
}: {
  positionInfo?: PositionInfo
  onContinue?: () => void
  disableContinue?: boolean
}) => {
  const { t } = useTranslation()
  const isD3LiquidityRangeChartEnabled = useFeatureFlag(FeatureFlags.D3LiquidityRangeChart)

  const {
    positionState: { fee, hook, initialPosition },
    currencies,
    creatingPoolOrPair,
    poolOrPairLoading,
    poolId,
    protocolVersion,
    poolOrPair,
    price,
    ticks,
    pricesAtTicks,
    ticksAtLimit,
    priceRangeState,
    setPriceRangeState,
  } = useCreateLiquidityContext()

  const { TOKEN0, TOKEN1 } = currencies.display
  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceRangeState.priceInverted)

  const controlOptions = useTokenControlOptions([TOKEN0, TOKEN1], 'small')

  const handleSelectToken = useCallback(
    (option: string) => {
      const initialMinMaxPrice = {
        minPrice: undefined,
        maxPrice: undefined,
      }
      if (option === TOKEN0?.symbol) {
        setPriceRangeState((prevState) => ({ ...prevState, ...initialMinMaxPrice, priceInverted: false }))
      } else {
        setPriceRangeState((prevState) => ({ ...prevState, ...initialMinMaxPrice, priceInverted: true }))
      }
    },
    [TOKEN0?.symbol, setPriceRangeState],
  )

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    protocolVersion === ProtocolVersion.V3
      ? {
          baseCurrency,
          quoteCurrency,
          feeAmount: fee?.feeAmount,
          tickLower: ticks[0],
          tickUpper: ticks[1],
          pool: poolOrPair,
        }
      : protocolVersion === ProtocolVersion.V4
        ? {
            baseCurrency,
            quoteCurrency,
            fee,
            tickLower: ticks[0],
            tickUpper: ticks[1],
            pool: poolOrPair,
          }
        : {
            baseCurrency: undefined,
            quoteCurrency: undefined,
            feeAmount: undefined,
            tickLower: undefined,
            tickUpper: undefined,
            pool: undefined,
          },
  )

  const handleSelectRange = useCallback(
    (option: RangeSelection) => {
      if (initialPosition?.isOutOfRange) {
        return
      }

      if (option === RangeSelection.FULL) {
        setPriceRangeState((prevState) => ({
          ...prevState,
          minPrice: '',
          maxPrice: '',
          fullRange: true,
        }))
      } else {
        setPriceRangeState((prevState) => ({
          ...prevState,
          minPrice: undefined,
          maxPrice: undefined,
          fullRange: false,
        }))
      }
    },
    [initialPosition?.isOutOfRange, setPriceRangeState],
  )

  const segmentedControlRangeOptions = [
    {
      display: <RangeControl value={t(`common.fullRange`)} active={priceRangeState.fullRange} />,
      value: RangeSelection.FULL,
    },
    {
      display: <RangeControl value={t(`common.customRange`)} active={!priceRangeState.fullRange} />,
      value: RangeSelection.CUSTOM,
    },
  ]

  const rangeSelectionInputValues = useMemo(() => {
    if (initialPosition?.isOutOfRange) {
      return [pricesAtTicks[0]?.toSignificant(8) ?? '', pricesAtTicks[1]?.toSignificant(8) ?? '']
    }

    return [
      ticksAtLimit[0] ? '0' : (pricesAtTicks[0]?.toSignificant(8) ?? ''),
      ticksAtLimit[1] ? '∞' : (pricesAtTicks[1]?.toSignificant(8) ?? ''),
    ]
  }, [pricesAtTicks, ticksAtLimit, initialPosition])

  const handleChartRangeInput = useCallback(
    (input: RangeSelectionInput, value: string | undefined) => {
      if (priceRangeState.fullRange || initialPosition?.isOutOfRange) {
        return
      } else if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value, fullRange: false }))
      }
    },
    [priceRangeState.fullRange, initialPosition?.isOutOfRange, setPriceRangeState],
  )

  const { rangeInputMinPrice, rangeInputMaxPrice } = useMemo(() => {
    if (priceRangeState.fullRange && !initialPosition?.isOutOfRange) {
      return {
        rangeInputMinPrice: undefined,
        rangeInputMaxPrice: undefined,
      }
    }

    return {
      rangeInputMinPrice: pricesAtTicks[0] ? parseFloat(pricesAtTicks[0].toSignificant(8)) : undefined,
      rangeInputMaxPrice: pricesAtTicks[1] ? parseFloat(pricesAtTicks[1].toSignificant(8)) : undefined,
    }
  }, [priceRangeState.fullRange, pricesAtTicks, initialPosition])

  const invalidPrice = isInvalidPrice(price)
  const invalidRange = isInvalidRange(ticks[0], ticks[1])

  const invalidState =
    disableContinue ||
    invalidPrice ||
    invalidRange ||
    (creatingPoolOrPair && (!priceRangeState.initialPrice || priceRangeState.initialPrice.length === 0))

  // Setting min/max price to empty string resets them to defaults (0 / Infinity)
  const setFallbackRangePrices = useCallback(() => {
    if (initialPosition?.isOutOfRange) {
      return
    }

    handleChartRangeInput(RangeSelectionInput.MIN, '')
    handleChartRangeInput(RangeSelectionInput.MAX, '')
  }, [handleChartRangeInput, initialPosition?.isOutOfRange])

  // If no pool is found for custom range, set min/max price to defaults
  useEffect(() => {
    if (
      !priceRangeState.fullRange &&
      !poolId &&
      priceRangeState.minPrice === undefined &&
      priceRangeState.maxPrice === undefined
    ) {
      setFallbackRangePrices()
    }
  }, [priceRangeState.fullRange, priceRangeState.minPrice, priceRangeState.maxPrice, poolId, setFallbackRangePrices])

  if (protocolVersion === ProtocolVersion.V2) {
    return <InitialPriceInput />
  }

  const isDisabled = initialPosition?.isOutOfRange
  const showIncrementButtons = !!poolOrPair && !priceRangeState.fullRange

  return (
    <>
      {creatingPoolOrPair && <InitialPriceInput />}
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.setRange" />
          </Text>
        </Flex>
        {!initialPosition?.isOutOfRange && (
          <SegmentedControl
            options={segmentedControlRangeOptions}
            selectedOption={priceRangeState.fullRange ? RangeSelection.FULL : RangeSelection.CUSTOM}
            onSelectOption={handleSelectRange}
            fullWidth
            size="large"
          />
        )}
        {!initialPosition?.isOutOfRange && (
          <Text variant="body3" color="$neutral2">
            {creatingPoolOrPair
              ? t('position.provide.liquidityDescription.creatingPool')
              : priceRangeState.fullRange
                ? t('position.provide.liquidityDescription')
                : t('position.provide.liquidityDescription.custom')}
          </Text>
        )}
        <PositionOutOfRangeError positionInfo={positionInfo} />
        <PoolOutOfSyncError />
        <Flex gap="$gap4" opacity={isDisabled ? 0.6 : 1}>
          {isDisabled && (
            <Flex
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              opacity={0}
              backgroundColor="$surface3"
              cursor="not-allowed"
              zIndex={zIndexes.overlay}
            />
          )}
          {baseCurrency &&
            quoteCurrency &&
            fee &&
            (isD3LiquidityRangeChartEnabled ? (
              <D3LiquidityRangeInput
                key={buildRangeInputKeyV2({ protocolVersion, poolId: poolId ?? '', priceRangeState })}
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                sdkCurrencies={currencies.sdk}
                creatingPoolOrPair={creatingPoolOrPair}
                currencyControlOptions={controlOptions}
                priceInverted={priceRangeState.priceInverted}
                feeTier={fee.feeAmount}
                hook={hook}
                tickSpacing={poolOrPair?.tickSpacing}
                protocolVersion={protocolVersion}
                poolId={poolId}
                poolOrPairLoading={poolOrPairLoading}
                price={price}
                currentPrice={Number(price?.toSignificant())}
                inputMode={priceRangeState.inputMode}
                initialPosition={initialPosition}
                minPrice={rangeInputMinPrice}
                maxPrice={rangeInputMaxPrice}
                isFullRange={priceRangeState.fullRange}
                handleSelectToken={handleSelectToken}
                setMinPrice={(minPrice?: number | null) => {
                  handleChartRangeInput(RangeSelectionInput.MIN, minPrice?.toString())
                }}
                setMaxPrice={(maxPrice?: number | null) => {
                  handleChartRangeInput(RangeSelectionInput.MAX, maxPrice?.toString())
                }}
                setIsFullRange={(isFullRange: boolean) => {
                  handleSelectRange(isFullRange ? RangeSelection.FULL : RangeSelection.CUSTOM)
                }}
                setInputMode={(inputMode) => {
                  setPriceRangeState((prev) => ({ ...prev, inputMode }))
                }}
              />
            ) : (
              <Flex
                backgroundColor="$surface2"
                gap="$gap16"
                borderRadius={poolId ? '$none' : '$rounded20'}
                borderTopLeftRadius={poolId ? '$rounded20' : '$none'}
                borderTopRightRadius={poolId ? '$rounded20' : '$none'}
              >
                <Flex
                  row
                  justifyContent="space-between"
                  alignItems="center"
                  p="$padding16"
                  $sm={{ row: false, alignItems: 'flex-start', gap: '$gap8' }}
                >
                  <DisplayCurrentPrice price={price} isLoading={poolOrPairLoading} />
                  {!creatingPoolOrPair && (
                    <SegmentedControl
                      options={controlOptions}
                      selectedOption={baseCurrency.symbol ?? ''}
                      onSelectOption={handleSelectToken}
                      size="smallThumbnail"
                    />
                  )}
                </Flex>
                <Flex p="$padding16">
                  <LiquidityRangeInput
                    key={buildRangeInputKey({ protocolVersion, poolId: poolId ?? '', priceRangeState })}
                    quoteCurrency={quoteCurrency}
                    baseCurrency={baseCurrency}
                    sdkCurrencies={currencies.sdk}
                    priceInverted={priceRangeState.priceInverted}
                    feeTier={fee.feeAmount}
                    hook={hook}
                    tickSpacing={poolOrPair?.tickSpacing}
                    protocolVersion={protocolVersion}
                    poolId={poolId}
                    poolOrPairLoading={poolOrPairLoading}
                    disableBrushInteraction={priceRangeState.fullRange}
                    midPrice={Number(price?.toSignificant())}
                    minPrice={rangeInputMinPrice}
                    maxPrice={rangeInputMaxPrice}
                    setMinPrice={(minPrice?: number) => {
                      handleChartRangeInput(RangeSelectionInput.MIN, minPrice?.toString())
                    }}
                    setMaxPrice={(maxPrice?: number) => {
                      handleChartRangeInput(RangeSelectionInput.MAX, maxPrice?.toString())
                    }}
                    setFallbackRangePrices={setFallbackRangePrices}
                  />
                </Flex>
              </Flex>
            ))}
          {isD3LiquidityRangeChartEnabled ? null : (
            <Flex row gap="$gap4" $lg={{ row: false }}>
              <RangeAmountInput
                input={RangeSelectionInput.MIN}
                decrement={priceRangeState.priceInverted ? getIncrementUpper : getDecrementLower}
                increment={priceRangeState.priceInverted ? getDecrementUpper : getIncrementLower}
                isIncrementDisabled={false}
                isDecrementDisabled={ticksAtLimit[0]}
                value={rangeSelectionInputValues[0]}
                showIncrementButtons={showIncrementButtons}
                isInvalid={invalidRange}
              />
              <RangeAmountInput
                input={RangeSelectionInput.MAX}
                decrement={priceRangeState.priceInverted ? getIncrementLower : getDecrementUpper}
                increment={priceRangeState.priceInverted ? getDecrementLower : getIncrementUpper}
                isIncrementDisabled={ticksAtLimit[1]}
                isDecrementDisabled={false}
                value={rangeSelectionInputValues[1]}
                showIncrementButtons={showIncrementButtons}
                isInvalid={invalidRange}
              />
            </Flex>
          )}
        </Flex>
        {(invalidPrice || invalidRange) && (
          <Flex row alignItems="center" px="$padding16" gap="$gap4">
            <AlertTriangleFilled size="$icon.16" color="$statusCritical" />
            <Text color="$statusCritical" variant="body3">
              {invalidRange ? t('position.create.invalidRange') : t('position.create.invalidPrice')}
            </Text>
          </Flex>
        )}
      </Flex>
      {onContinue && (
        <Flex row>
          <Button onPress={onContinue} isDisabled={invalidState}>
            {t(`common.button.continue`)}
          </Button>
        </Flex>
      )}
    </>
  )
}

function buildRangeInputKey({
  protocolVersion,
  poolId,
  priceRangeState,
}: {
  protocolVersion: ProtocolVersion
  poolId: string
  priceRangeState: PriceRangeState
}) {
  return `${poolId}-${priceRangeState.fullRange}-${priceRangeState.priceInverted}-${protocolVersion}`
}

function buildRangeInputKeyV2({
  protocolVersion,
  poolId,
  priceRangeState,
}: {
  protocolVersion: ProtocolVersion
  poolId: string
  priceRangeState: PriceRangeState
}) {
  return `${poolId}-${priceRangeState.priceInverted}-${protocolVersion}`
}
