import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { LiquidityRangeInput } from 'components/Charts/LiquidityRangeInput/LiquidityRangeInput'
import { PositionInfo } from 'components/Liquidity/types'
import { BaseQuoteFiatAmount } from 'pages/Pool/Positions/create/BaseQuoteFiatAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PoolOutOfSyncError } from 'pages/Pool/Positions/create/PoolOutOfSyncError'
import { PositionOutOfRangeError } from 'pages/Pool/Positions/create/PositionOutOfRangeError'
import { useTokenControlOptions } from 'pages/Pool/Positions/create/hooks/useTokenControlOptions'
import { CreatePositionInfo, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useRangeHopCallbacks } from 'state/mint/v3/hooks'
import { tryParsePrice } from 'state/mint/v3/utils'
import {
  AnimatePresence,
  Button,
  Flex,
  FlexProps,
  SegmentedControl,
  Text,
  TouchableArea,
  useMedia,
  useSporeColors,
} from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { fonts, zIndexes } from 'ui/src/theme'
import { AmountInput, numericInputRegex } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

enum RangeSelectionInput {
  MIN = 0,
  MAX = 1,
}

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

function DisplayCurrentPrice({ price, isLoading }: { price?: Price<Currency, Currency>; isLoading?: boolean }) {
  return (
    <Flex gap="$gap4" row alignItems="center" $md={{ row: false, alignItems: 'flex-start' }}>
      {isLoading ? (
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="common.marketPrice.fetching" />
        </Text>
      ) : price ? (
        <>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.marketPrice.label" />
          </Text>
          <BaseQuoteFiatAmount price={price} base={price?.baseCurrency} quote={price?.quoteCurrency} />
        </>
      ) : (
        <Flex row alignItems="center" gap="$spacing4">
          <AlertTriangleFilled size={16} color="$neutral2" />
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.marketPrice.unavailable" />
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

const InitialPriceInput = () => {
  const [otherCurrencyPrice, setOtherCurrencyPrice] = useState<string | undefined>()

  const media = useMedia()
  const colors = useSporeColors()

  const { derivedPositionInfo } = useCreatePositionContext()
  const { derivedPriceRangeInfo } = usePriceRangeContext()
  const {
    priceRangeState: { initialPrice, priceInverted, isInitialPriceDirty },
    setPriceRangeState,
  } = usePriceRangeContext()

  const { defaultInitialPrice, isDefaultInitialPriceLoading } = derivedPositionInfo
  const { priceDifference } = derivedPriceRangeInfo
  const formattedDefaultInitialPrice = useMemo(() => {
    if (!defaultInitialPrice) {
      return ''
    }

    return priceInverted ? defaultInitialPrice?.invert().toSignificant(8) : defaultInitialPrice?.toSignificant(8)
  }, [defaultInitialPrice, priceInverted])

  useEffect(() => {
    if (formattedDefaultInitialPrice && !isInitialPriceDirty) {
      setPriceRangeState((prevState) => ({
        ...prevState,
        initialPrice: formattedDefaultInitialPrice,
      }))
    }
  }, [formattedDefaultInitialPrice, isInitialPriceDirty, setPriceRangeState])

  useEffect(() => {
    try {
      const base = priceInverted ? derivedPositionInfo.currencies[1] : derivedPositionInfo.currencies[0]
      const quote = priceInverted ? derivedPositionInfo.currencies[0] : derivedPositionInfo.currencies[1]

      if (initialPrice && base && quote) {
        const parsedPrice = tryParsePrice(base, quote, initialPrice)
        setOtherCurrencyPrice(parsedPrice?.invert().toSignificant(8))
      }
    } catch (error) {
      setOtherCurrencyPrice(undefined)
    }
  }, [derivedPositionInfo.currencies, initialPrice, priceInverted])

  const [token0, token1] = derivedPositionInfo.currencies
  const [initialPriceBaseToken, initialPriceQuoteToken] = getInvertedTuple(
    derivedPositionInfo.currencies,
    priceInverted,
  )

  const controlOptions = useTokenControlOptions([token0, token1], 'large')

  const handleSelectInitialPriceBaseToken = useCallback(
    (option: string) => {
      if (option === token0?.symbol) {
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
    [token0?.symbol, otherCurrencyPrice, setPriceRangeState],
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
                selectedOption={initialPriceBaseToken?.symbol ?? ''}
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
                selectedOption={initialPriceBaseToken?.symbol ?? ''}
                onSelectOption={handleSelectInitialPriceBaseToken}
                size="largeThumbnail"
              />
            )}
          </Flex>
          <Flex row $sm={{ row: false, alignItems: 'flex-start' }} alignItems="center" justifyContent="space-between">
            <Text variant="body2" color="$neutral2" $md={{ variant: 'body3' }} flexShrink={0}>
              {initialPriceQuoteToken?.symbol} = 1 {initialPriceBaseToken?.symbol}
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

function numericInputEnforcerWithInfinity(value?: string): boolean {
  return !value || numericInputRegex.test(value) || value === '∞'
}

function RangeInput({
  value,
  input,
  decrement,
  increment,
  showIncrementButtons = true,
  isInvalid = false,
}: {
  value: string
  input: RangeSelectionInput
  decrement: () => string
  increment: () => string
  showIncrementButtons?: boolean
  isInvalid?: boolean
}) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const { derivedPositionInfo } = useCreatePositionContext()
  const {
    priceRangeState: { priceInverted },
    setPriceRangeState,
  } = usePriceRangeContext()

  const [typedValue, setTypedValue] = useState('')
  const [baseCurrency, quoteCurrency] = getInvertedTuple(derivedPositionInfo.currencies, priceInverted)
  const [displayUserTypedValue, setDisplayUserTypedValue] = useState(false)

  const handlePriceRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value, fullRange: false }))
      }

      setTypedValue(value)
      setDisplayUserTypedValue(true)
    },
    [setPriceRangeState],
  )

  const handleDecrement = useCallback(() => {
    handlePriceRangeInput(input, decrement())
    setDisplayUserTypedValue(false)
  }, [decrement, handlePriceRangeInput, input])

  const handleIncrement = useCallback(() => {
    handlePriceRangeInput(input, increment())
    setDisplayUserTypedValue(false)
  }, [handlePriceRangeInput, increment, input])

  return (
    <Flex
      row
      flex={1}
      position="relative"
      backgroundColor="$surface2"
      borderTopLeftRadius={
        derivedPositionInfo.creatingPoolOrPair && input === RangeSelectionInput.MIN ? '$rounded20' : '$none'
      }
      borderTopRightRadius={
        derivedPositionInfo.creatingPoolOrPair && input === RangeSelectionInput.MAX ? '$rounded20' : '$none'
      }
      borderBottomRightRadius={input === RangeSelectionInput.MIN ? '$none' : '$rounded20'}
      borderBottomLeftRadius={input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
      $lg={{
        borderBottomRightRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
        borderBottomLeftRadius: input === RangeSelectionInput.MAX ? '$rounded20' : '$none',
      }}
      p="$spacing16"
      justifyContent="space-between"
      overflow="hidden"
    >
      <Flex gap="$gap4" overflow="hidden" flex={1}>
        <Text variant="body3" color="$neutral2">
          {input === RangeSelectionInput.MIN ? t(`pool.minPrice`) : t(`pool.maxPrice`)}
        </Text>
        <AmountInput
          backgroundColor="$transparent"
          borderWidth="$none"
          borderRadius="$none"
          color={isInvalid ? '$statusCritical' : '$neutral1'}
          fontFamily="$heading"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          maxDecimals={quoteCurrency?.decimals ?? 18}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={displayUserTypedValue ? typedValue : value}
          onChangeText={(text) => handlePriceRangeInput(input, text)}
          onBlur={() => setDisplayUserTypedValue(false)}
          inputEnforcer={numericInputEnforcerWithInfinity}
          $md={{
            fontSize: fonts.subheading2.fontSize,
            fontWeight: fonts.subheading2.fontWeight,
          }}
        />
        <Text variant="body3" color="$neutral2">
          {quoteCurrency?.symbol} = 1 {baseCurrency?.symbol}
        </Text>
      </Flex>
      {showIncrementButtons && (
        <Flex gap={10}>
          <TouchableArea
            alignItems="center"
            justifyContent="center"
            onPress={handleIncrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Plus size={16} />
          </TouchableArea>
          <TouchableArea
            alignItems="center"
            justifyContent="center"
            onPress={handleDecrement}
            borderRadius="$roundedFull"
            p={8}
            backgroundColor="$surface3"
            hoverable
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
          >
            <Minus size={16} />
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}

export const SelectPriceRangeStepV2 = ({ onContinue }: { onContinue?: () => void } & FlexProps) => {
  const { t } = useTranslation()
  return (
    <>
      <InitialPriceInput />
      {onContinue ?? <Button onPress={onContinue}>{t('common.button.continue')}</Button>}
    </>
  )
}

export const SelectPriceRangeStep = ({
  positionInfo,
  onContinue,
  onDisableContinue,
}: {
  positionInfo?: PositionInfo
  onContinue?: () => void
  onDisableContinue?: boolean
}) => {
  const { t } = useTranslation()

  const {
    positionState: { fee, hook, initialPosition },
    derivedPositionInfo,
  } = useCreatePositionContext()
  const { priceRangeState, setPriceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [baseCurrency, quoteCurrency] = getInvertedTuple(derivedPositionInfo.currencies, priceRangeState.priceInverted)
  const creatingPoolOrPair = derivedPositionInfo.creatingPoolOrPair

  const controlOptions = useTokenControlOptions([token0, token1], 'small')

  const handleSelectToken = useCallback(
    (option: string) => {
      if (option === token0?.symbol) {
        setPriceRangeState((prevState) => ({ ...prevState, priceInverted: false }))
      } else {
        setPriceRangeState((prevState) => ({ ...prevState, priceInverted: true }))
      }
    },
    [token0?.symbol, setPriceRangeState],
  )

  const { price } = derivedPriceRangeInfo
  const { ticks, isSorted, prices, ticksAtLimit, invalidPrice, invalidRange, invertPrice } = useMemo(() => {
    if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2) {
      return {
        ticks: undefined,
        isSorted: false,
        prices: undefined,
        pricesAtTicks: undefined,
        ticksAtLimit: [false, false],
        invalidPrice: false,
        invalidRange: false,
        invertPrice: false,
      }
    }

    return derivedPriceRangeInfo
  }, [derivedPriceRangeInfo])
  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    derivedPositionInfo.protocolVersion === ProtocolVersion.V3
      ? {
          baseCurrency,
          quoteCurrency,
          feeAmount: fee.feeAmount,
          tickLower: ticks?.[0],
          tickUpper: ticks?.[1],
          pool: derivedPositionInfo.pool,
        }
      : derivedPositionInfo.protocolVersion === ProtocolVersion.V4
        ? {
            baseCurrency,
            quoteCurrency,
            fee,
            tickLower: ticks?.[0],
            tickUpper: ticks?.[1],
            pool: derivedPositionInfo.pool,
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
    const leftPrice = isSorted ? prices?.[0] : prices?.[1]?.invert()
    const rightPrice = isSorted ? prices?.[1] : prices?.[0]?.invert()

    if (initialPosition?.isOutOfRange) {
      return [leftPrice?.toSignificant(8) ?? '', rightPrice?.toSignificant(8) ?? '']
    }

    return [
      ticksAtLimit[isSorted ? 0 : 1] ? '0' : leftPrice?.toSignificant(8) ?? '',
      ticksAtLimit[isSorted ? 1 : 0] ? '∞' : rightPrice?.toSignificant(8) ?? '',
    ]
  }, [isSorted, prices, ticksAtLimit, initialPosition])

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

    if (invertPrice) {
      return {
        rangeInputMinPrice: prices?.[1] ? parseFloat(prices?.[1].invert().toSignificant(8)) : undefined,
        rangeInputMaxPrice: prices?.[0] ? parseFloat(prices?.[0].invert().toSignificant(8)) : undefined,
      }
    }

    return {
      rangeInputMinPrice: prices?.[0] ? parseFloat(prices?.[0].toSignificant(8)) : undefined,
      rangeInputMaxPrice: prices?.[1] ? parseFloat(prices?.[1].toSignificant(8)) : undefined,
    }
  }, [priceRangeState.fullRange, prices, invertPrice, initialPosition])

  const invalidState =
    onDisableContinue ||
    invalidPrice ||
    invalidRange ||
    (derivedPositionInfo.creatingPoolOrPair &&
      (!priceRangeState.initialPrice || priceRangeState.initialPrice.length === 0))

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
      !derivedPositionInfo.poolId &&
      priceRangeState.minPrice === undefined &&
      priceRangeState.maxPrice === undefined
    ) {
      setFallbackRangePrices()
    }
  }, [
    priceRangeState.fullRange,
    priceRangeState.minPrice,
    priceRangeState.maxPrice,
    derivedPositionInfo.poolId,
    setFallbackRangePrices,
  ])

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return (
      <>
        <InitialPriceInput />
        {onContinue && (
          <Button onPress={onContinue} isDisabled={invalidState}>
            {t('common.button.continue')}
          </Button>
        )}
      </>
    )
  }

  const isDisabled = initialPosition?.isOutOfRange
  const showIncrementButtons = !!derivedPositionInfo.pool && !priceRangeState.fullRange

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
            {derivedPositionInfo.creatingPoolOrPair
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
              cursor={isDisabled ? 'not-allowed' : 'auto'}
              zIndex={zIndexes.overlay}
            />
          )}
          {baseCurrency && quoteCurrency && derivedPositionInfo.poolId && (
            <Flex
              backgroundColor="$surface2"
              p="$padding16"
              gap="$gap16"
              borderRadius={derivedPositionInfo.poolId ? '$none' : '$rounded20'}
              borderTopLeftRadius={derivedPositionInfo.poolId ? '$rounded20' : '$none'}
              borderTopRightRadius={derivedPositionInfo.poolId ? '$rounded20' : '$none'}
              $lg={{
                px: '$spacing8',
              }}
            >
              <Flex
                row
                justifyContent="space-between"
                alignItems="center"
                $sm={{ row: false, alignItems: 'flex-start', gap: '$gap8' }}
              >
                <DisplayCurrentPrice price={invertPrice ? price?.invert() : price} />
                {!creatingPoolOrPair && (
                  <SegmentedControl
                    options={controlOptions}
                    selectedOption={baseCurrency?.symbol ?? ''}
                    onSelectOption={handleSelectToken}
                    size="smallThumbnail"
                  />
                )}
              </Flex>
              <LiquidityRangeInput
                key={buildRangeInputKey({ derivedPositionInfo, priceRangeState })}
                currency0={quoteCurrency}
                currency1={baseCurrency}
                feeTier={fee.feeAmount}
                hook={hook}
                tickSpacing={derivedPositionInfo.pool?.tickSpacing}
                protocolVersion={derivedPositionInfo.protocolVersion}
                poolId={derivedPositionInfo.poolId}
                disableBrushInteraction={priceRangeState.fullRange}
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
          )}
          <Flex row gap="$gap4" $lg={{ row: false }}>
            <RangeInput
              input={RangeSelectionInput.MIN}
              decrement={isSorted ? getDecrementLower : getIncrementUpper}
              increment={isSorted ? getIncrementLower : getDecrementUpper}
              value={rangeSelectionInputValues[0]}
              showIncrementButtons={showIncrementButtons}
              isInvalid={invalidRange}
            />
            <RangeInput
              input={RangeSelectionInput.MAX}
              decrement={isSorted ? getDecrementUpper : getIncrementLower}
              increment={isSorted ? getIncrementUpper : getDecrementLower}
              value={rangeSelectionInputValues[1]}
              showIncrementButtons={showIncrementButtons}
              isInvalid={invalidRange}
            />
          </Flex>
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
  derivedPositionInfo,
  priceRangeState,
}: {
  derivedPositionInfo: CreatePositionInfo
  priceRangeState: PriceRangeState
}) {
  return `${derivedPositionInfo.poolId}-${priceRangeState.fullRange}-${priceRangeState.priceInverted}-${derivedPositionInfo.protocolVersion}`
}
