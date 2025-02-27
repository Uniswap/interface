// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { LiquidityRangeInput } from 'components/Charts/LiquidityRangeInput/LiquidityRangeInput'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { BaseQuoteFiatAmount } from 'pages/Pool/Positions/create/BaseQuoteFiatAmount'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { PoolOutOfSyncError } from 'pages/Pool/Positions/create/PoolOutOfSyncError'
import { Container } from 'pages/Pool/Positions/create/shared'
import { CreatePositionInfo, PriceRangeState } from 'pages/Pool/Positions/create/types'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useRangeHopCallbacks } from 'state/mint/v3/hooks'
import { DeprecatedButton, Flex, FlexProps, SegmentedControl, Text, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { fonts } from 'ui/src/theme'
import { AmountInput, numericInputRegex } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

enum RangeSelectionInput {
  MIN,
  MAX,
}

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

function DisplayCurrentPrice({ price }: { price?: Price<Currency, Currency> }) {
  return (
    <Flex gap="$gap8" row alignItems="center" $md={{ row: false, alignItems: 'flex-start' }}>
      {price ? (
        <>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="common.currentPrice.label" />
          </Text>
          <BaseQuoteFiatAmount price={price} base={price?.baseCurrency} quote={price?.quoteCurrency} />
        </>
      ) : (
        <Text variant="body3" color="$neutral2">
          <Trans i18nKey="common.currentPrice.unavailable" />
        </Text>
      )}
    </Flex>
  )
}

const InitialPriceInput = () => {
  const colors = useSporeColors()

  const { derivedPositionInfo } = useCreatePositionContext()
  const {
    priceRangeState: { initialPrice, priceInverted },
    setPriceRangeState,
    derivedPriceRangeInfo,
  } = usePriceRangeContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [initialPriceBaseToken, initialPriceQuoteToken] = getInvertedTuple(
    derivedPositionInfo.currencies,
    priceInverted,
  )
  const { price, invertPrice } = derivedPriceRangeInfo

  const controlOptions = useMemo(() => {
    return [{ value: token0?.symbol ?? '' }, { value: token1?.symbol ?? '' }]
  }, [token0?.symbol, token1?.symbol])

  const handleSelectInitialPriceBaseToken = useCallback(
    (option: string) => {
      if (option === token0?.symbol) {
        setPriceRangeState((prevState) => ({ ...prevState, priceInverted: false }))
      } else {
        setPriceRangeState((prevState) => ({ ...prevState, priceInverted: true }))
      }
    },
    [token0?.symbol, setPriceRangeState],
  )

  return (
    <Flex gap="$spacing12">
      <Flex row justifyContent="space-between">
        <Flex shrink gap="$spacing4">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.initialPrice" />
          </Text>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey="position.initialPrice.info" />
          </Text>
        </Flex>
        <SegmentedControl
          options={controlOptions}
          selectedOption={initialPriceBaseToken?.symbol ?? ''}
          onSelectOption={handleSelectInitialPriceBaseToken}
        />
      </Flex>
      <Flex
        row
        backgroundColor="$surface2"
        borderWidth="$spacing1"
        borderColor="$surface3"
        py="$spacing12"
        px="$spacing16"
        borderRadius="$rounded16"
        gap="$spacing12"
        justifyContent="space-between"
        alignItems="center"
      >
        <AmountInput
          backgroundColor="$transparent"
          borderWidth="$none"
          borderRadius="$none"
          color="$neutral1"
          fontFamily="$heading"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          lineHeight={fonts.heading3.lineHeight}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={initialPrice}
          onChangeText={(text) => setPriceRangeState((prev) => ({ ...prev, initialPrice: text }))}
        />
        <Text variant="body2" color="$neutral2" $md={{ variant: 'body3' }} flexShrink={0}>
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: initialPriceQuoteToken?.symbol,
              symbolB: initialPriceBaseToken?.symbol,
            }}
          />
        </Text>
      </Flex>
      <DisplayCurrentPrice price={invertPrice ? price?.invert() : price} />
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
      borderBottomRightRadius={input === RangeSelectionInput.MIN ? '$none' : '$rounded20'}
      borderBottomLeftRadius={input === RangeSelectionInput.MIN ? '$rounded20' : '$none'}
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
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: quoteCurrency?.symbol,
              symbolB: baseCurrency?.symbol,
            }}
          />
        </Text>
      </Flex>
      {showIncrementButtons && (
        <Flex gap={10}>
          <DeprecatedButton theme="secondary" p="$spacing8" borderRadius="$roundedFull" onPress={handleIncrement}>
            <Plus size="16px" color={colors.neutral1.val} />
          </DeprecatedButton>
          <DeprecatedButton
            theme="secondary"
            p="$spacing8"
            borderRadius="$roundedFull"
            color="$neutral1"
            onPress={handleDecrement}
          >
            <Minus size="16px" color={colors.neutral1.val} />
          </DeprecatedButton>
        </Flex>
      )}
    </Flex>
  )
}

export const SelectPriceRangeStepV2 = ({ onContinue, ...rest }: { onContinue: () => void } & FlexProps) => {
  return (
    <Container {...rest}>
      <InitialPriceInput />
      <DeprecatedButton
        flex={1}
        py="$spacing16"
        px="$spacing20"
        backgroundColor="$accent3"
        hoverStyle={{
          backgroundColor: undefined,
          opacity: 0.8,
        }}
        pressStyle={{
          backgroundColor: undefined,
        }}
        onPress={onContinue}
      >
        <Text variant="buttonLabel1" color="$surface1">
          <Trans i18nKey="common.button.continue" />
        </Text>
      </DeprecatedButton>
    </Container>
  )
}

export const SelectPriceRangeStep = ({
  onContinue,
  onDisableContinue,
  ...rest
}: { onContinue: () => void; onDisableContinue?: boolean } & FlexProps) => {
  const { t } = useTranslation()

  const {
    positionState: { fee, hook },
    derivedPositionInfo,
  } = useCreatePositionContext()
  const { priceRangeState, setPriceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [baseCurrency, quoteCurrency] = getInvertedTuple(derivedPositionInfo.currencies, priceRangeState.priceInverted)
  const creatingPoolOrPair = derivedPositionInfo.creatingPoolOrPair

  const isPriceRangeInputV2Enabled = useFeatureFlag(FeatureFlags.PriceRangeInputV2)

  const controlOptions = useMemo(() => {
    return [{ value: token0?.symbol ?? '' }, { value: token1?.symbol ?? '' }]
  }, [token0, token1])

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

  const price = derivedPriceRangeInfo.price
  const { ticks, isSorted, prices, ticksAtLimit, pricesAtTicks, invalidPrice, invalidRange, invertPrice } =
    useMemo(() => {
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
    [setPriceRangeState],
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
    return [
      ticksAtLimit[isSorted ? 0 : 1] ? '0' : leftPrice?.toSignificant(8) ?? '',
      ticksAtLimit[isSorted ? 1 : 0] ? '∞' : rightPrice?.toSignificant(8) ?? '',
    ]
  }, [isSorted, prices, ticksAtLimit])

  const handleChartRangeInput = useCallback(
    (input: RangeSelectionInput, value: string | undefined) => {
      if (priceRangeState.fullRange) {
        return
      } else if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value, fullRange: false }))
      }
    },
    [priceRangeState.fullRange, setPriceRangeState],
  )

  const { rangeInputMinPrice, rangeInputMaxPrice } = useMemo(() => {
    if (priceRangeState.fullRange) {
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
  }, [priceRangeState.fullRange, prices, invertPrice])

  const invalidState =
    onDisableContinue ||
    invalidPrice ||
    invalidRange ||
    (derivedPositionInfo.creatingPoolOrPair &&
      (!priceRangeState.initialPrice || priceRangeState.initialPrice.length === 0))

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return (
      <Container {...rest}>
        <InitialPriceInput />
        <DeprecatedButton
          flex={1}
          py="$spacing16"
          px="$spacing20"
          backgroundColor="$accent3"
          hoverStyle={{
            backgroundColor: undefined,
            opacity: 0.8,
          }}
          pressStyle={{
            backgroundColor: undefined,
          }}
          onPress={onContinue}
          isDisabled={invalidState}
        >
          <Text variant="buttonLabel1" color="$surface1">
            <Trans i18nKey="common.button.continue" />
          </Text>
        </DeprecatedButton>
      </Container>
    )
  }

  const showIncrementButtons = !!derivedPositionInfo.pool && !priceRangeState.fullRange

  return (
    <Container {...rest}>
      {creatingPoolOrPair && <InitialPriceInput />}
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.setRange" />
          </Text>
          <SegmentedControl
            options={controlOptions}
            selectedOption={baseCurrency?.symbol ?? ''}
            onSelectOption={handleSelectToken}
          />
        </Flex>
        <SegmentedControl
          options={segmentedControlRangeOptions}
          selectedOption={priceRangeState.fullRange ? RangeSelection.FULL : RangeSelection.CUSTOM}
          onSelectOption={handleSelectRange}
          fullWidth
          size="large"
        />
        <Text variant="body3" color="$neutral2">
          {priceRangeState.fullRange
            ? t('position.provide.liquidityDescription')
            : t('position.provide.liquidityDescription.custom')}
        </Text>
        <PoolOutOfSyncError />
        <Flex gap="$gap4">
          <Flex
            backgroundColor="$surface2"
            p="$padding16"
            gap="$gap12"
            borderTopLeftRadius="$rounded20"
            borderTopRightRadius="$rounded20"
            $lg={{
              px: '$spacing8',
            }}
          >
            <DisplayCurrentPrice price={invertPrice ? price?.invert() : price} />
            {!creatingPoolOrPair && !isPriceRangeInputV2Enabled && (
              <LiquidityChartRangeInput
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={fee.feeAmount}
                hook={hook}
                ticksAtLimit={{
                  LOWER: ticksAtLimit[0],
                  UPPER: ticksAtLimit[1],
                }}
                price={price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined}
                priceLower={pricesAtTicks?.[0]}
                priceUpper={pricesAtTicks?.[1]}
                onLeftRangeInput={(text) => handleChartRangeInput(RangeSelectionInput.MIN, text)}
                onRightRangeInput={(text) => handleChartRangeInput(RangeSelectionInput.MAX, text)}
                interactive={true}
                protocolVersion={derivedPositionInfo.protocolVersion}
                tickSpacing={derivedPositionInfo.pool?.tickSpacing}
              />
            )}
            {isPriceRangeInputV2Enabled && baseCurrency && quoteCurrency && derivedPositionInfo.poolId && (
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
              />
            )}
          </Flex>
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
      <DeprecatedButton
        flex={1}
        py="$spacing16"
        px="$spacing20"
        backgroundColor="$accent3"
        hoverStyle={{
          backgroundColor: undefined,
          opacity: 0.8,
        }}
        pressStyle={{
          backgroundColor: undefined,
        }}
        onPress={onContinue}
        isDisabled={invalidState}
      >
        <Text variant="buttonLabel1" color="$surface1">
          {t(`common.button.continue`)}
        </Text>
      </DeprecatedButton>
    </Container>
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
