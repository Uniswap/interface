/* oxlint-disable max-lines */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, SegmentedControl, Text, useMedia, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { fonts, zIndexes } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { D3LiquidityRangeInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { useTokenControlOptions } from '~/features/Liquidity/Create/hooks/useTokenControlOptions'
import { PoolOutOfSyncError } from '~/features/Liquidity/Create/PoolOutOfSyncError'
import { PoolParsingError } from '~/features/Liquidity/Create/PoolParsingError'
import { PositionOutOfRangeError } from '~/features/Liquidity/Create/PositionOutOfRangeError'
import { RangeSelectionInput } from '~/features/Liquidity/Create/RangeAmountInput'
import { PriceRangeState } from '~/features/Liquidity/Create/types'
import { DisplayCurrentPrice } from '~/features/Liquidity/DisplayCurrentPrice'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { getPriceDifference } from '~/features/Liquidity/utils/getPriceDifference'
import { isInvalidPrice, isInvalidRange } from '~/features/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { tryParsePrice } from '~/state/mint/v3/utils'
import { PositionField } from '~/types/position'

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

const InitialPriceInput = () => {
  const [otherCurrencyPrice, setOtherCurrencyPrice] = useState<string | undefined>()

  const { t } = useTranslation()
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
            {t('position.initialPrice.set')}
          </Text>
          <Text variant="body3" color="$neutral2">
            {t('position.initialPrice.info')}
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
              {t('position.initialPrice')}
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
                    {priceDifference.value < 0
                      ? t('position.initialPrice.difference.negative', {
                          value: priceDifference.absoluteValue,
                        })
                      : t('position.initialPrice.difference.positive', {
                          value: priceDifference.absoluteValue,
                        })}
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
                disabled={priceDifference?.absoluteValue ? priceDifference.absoluteValue === 0 : !!initialPrice}
                variant="default"
                emphasis="secondary"
                size="xxsmall"
                py="$spacing12"
                px="$spacing8"
                onPress={handleUseMarketPrice}
              >
                {t('position.initialPrice.useMarketPrice')}
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

// oxlint-disable-next-line complexity
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

  const {
    positionState: { fee, hook, migratingPosition },
    currencies,
    creatingPoolOrPair,
    poolOrPairLoading,
    poolId,
    protocolVersion,
    poolOrPair,
    price,
    ticks,
    priceRangeState,
    setPriceRangeState,
  } = useCreateLiquidityContext()

  const { TOKEN0, TOKEN1 } = currencies.display
  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.display, priceRangeState.priceInverted)

  const controlOptions = useTokenControlOptions([TOKEN0, TOKEN1], 'small')

  const handleSelectToken = useCallback(
    (option: string) => {
      if (option === TOKEN0?.symbol) {
        setPriceRangeState((prevState) => ({
          ...prevState,
          priceInverted: false,
          minTick: undefined,
          maxTick: undefined,
        }))
      } else {
        setPriceRangeState((prevState) => ({
          ...prevState,
          priceInverted: true,
          minTick: undefined,
          maxTick: undefined,
        }))
      }
    },
    [TOKEN0?.symbol, setPriceRangeState],
  )

  const handleSelectRange = useCallback(
    (option: RangeSelection) => {
      if (migratingPosition?.isOutOfRange) {
        return
      }

      if (option === RangeSelection.FULL) {
        setPriceRangeState((prevState) => ({
          ...prevState,
          minTick: undefined,
          maxTick: undefined,
          fullRange: true,
        }))
      } else {
        setPriceRangeState((prevState) => ({
          ...prevState,
          fullRange: false,
        }))
      }
    },
    [migratingPosition?.isOutOfRange, setPriceRangeState],
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

  const handleChartRangeInput = useCallback(
    ({ input, tick }: { input: RangeSelectionInput; tick?: number }) => {
      if (priceRangeState.fullRange || migratingPosition?.isOutOfRange) {
        return
      } else if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minTick: tick, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxTick: tick, fullRange: false }))
      }
    },
    [priceRangeState.fullRange, migratingPosition?.isOutOfRange, setPriceRangeState],
  )

  const invalidPrice = isInvalidPrice(price)
  const invalidRange = isInvalidRange(ticks[0], ticks[1])

  const invalidState =
    disableContinue ||
    invalidPrice ||
    invalidRange ||
    (creatingPoolOrPair && (!priceRangeState.initialPrice || priceRangeState.initialPrice.length === 0))

  // Setting min/max price to empty string resets them to defaults (0 / Infinity)
  const setFallbackRangePrices = useCallback(() => {
    if (migratingPosition?.isOutOfRange) {
      return
    }

    handleChartRangeInput({ input: RangeSelectionInput.MIN, tick: undefined })
    handleChartRangeInput({ input: RangeSelectionInput.MAX, tick: undefined })
  }, [handleChartRangeInput, migratingPosition?.isOutOfRange])

  // If no pool is found for custom range, set min/max price to defaults
  useEffect(() => {
    if (
      !priceRangeState.fullRange &&
      !poolId &&
      priceRangeState.minTick === undefined &&
      priceRangeState.maxTick === undefined
    ) {
      setFallbackRangePrices()
    }
  }, [priceRangeState.fullRange, priceRangeState.minTick, priceRangeState.maxTick, poolId, setFallbackRangePrices])

  if (protocolVersion === ProtocolVersion.V2) {
    // Only a brand-new pair needs an initial price; an existing pair has nothing to set here.
    return creatingPoolOrPair ? <InitialPriceInput /> : null
  }

  const isDisabled = migratingPosition?.isOutOfRange

  return (
    <>
      {creatingPoolOrPair && <InitialPriceInput />}
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text flex={1} variant="subheading1">
            {t('position.setRange')}
          </Text>
        </Flex>
        {!migratingPosition?.isOutOfRange && (
          <SegmentedControl
            options={segmentedControlRangeOptions}
            selectedOption={priceRangeState.fullRange ? RangeSelection.FULL : RangeSelection.CUSTOM}
            onSelectOption={handleSelectRange}
            fullWidth
            size="large"
          />
        )}
        {!migratingPosition?.isOutOfRange && (
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
        <PoolParsingError formComplete />
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
          {baseCurrency && quoteCurrency && fee && poolOrPair?.tickCurrent !== undefined && poolOrPair.tickSpacing && (
            <D3LiquidityRangeInput
              key={buildRangeInputKey({ protocolVersion, poolId: poolId ?? '', priceRangeState })}
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              sdkCurrencies={currencies.sdk}
              creatingPoolOrPair={creatingPoolOrPair}
              currencyControlOptions={controlOptions}
              priceInverted={priceRangeState.priceInverted}
              feeTier={fee.feeAmount}
              hook={hook}
              tickSpacing={poolOrPair.tickSpacing}
              currentTick={poolOrPair.tickCurrent}
              protocolVersion={protocolVersion}
              poolId={poolId}
              poolOrPairLoading={poolOrPairLoading}
              price={price}
              currentPrice={Number(price?.toSignificant())}
              inputMode={priceRangeState.inputMode}
              migratingPosition={migratingPosition}
              minTick={priceRangeState.minTick}
              maxTick={priceRangeState.maxTick}
              isFullRange={priceRangeState.fullRange}
              handleSelectToken={handleSelectToken}
              setMinTick={(tick) => {
                setPriceRangeState((prev) => {
                  if (tick !== undefined && prev.maxTick !== undefined && tick >= prev.maxTick) {
                    return { ...prev, minTick: prev.maxTick - poolOrPair.tickSpacing }
                  }
                  return { ...prev, minTick: tick }
                })
              }}
              setMaxTick={(tick) => {
                setPriceRangeState((prev) => {
                  if (tick !== undefined && prev.minTick !== undefined && tick <= prev.minTick) {
                    return { ...prev, maxTick: prev.minTick + poolOrPair.tickSpacing }
                  }
                  return { ...prev, maxTick: tick }
                })
              }}
              setIsFullRange={(isFullRange: boolean) => {
                handleSelectRange(isFullRange ? RangeSelection.FULL : RangeSelection.CUSTOM)
              }}
              setInputMode={(inputMode) => {
                setPriceRangeState((prev) => ({ ...prev, inputMode }))
              }}
            />
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
          <Button onPress={onContinue} disabled={invalidState}>
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
  return `${poolId}-${priceRangeState.priceInverted}-${protocolVersion}`
}
