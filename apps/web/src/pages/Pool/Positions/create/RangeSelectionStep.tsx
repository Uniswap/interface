// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { calculateInvertedPrice } from 'components/Liquidity/utils'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container } from 'pages/Pool/Positions/create/shared'
import { getInvertedTuple } from 'pages/Pool/Positions/create/utils'
import { useCallback, useMemo, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { useRangeHopCallbacks } from 'state/mint/v3/hooks'
import { Button, Flex, FlexProps, SegmentedControl, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { fonts } from 'ui/src/theme'
import { AmountInput, numericInputRegex } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { areCurrenciesEqual } from 'uniswap/src/utils/currencyId'
import { NumberType, useFormatter } from 'utils/formatNumbers'

enum RangeSelectionInput {
  MIN,
  MAX,
}

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

function DisplayCurrentPrice({ price }: { price?: Price<Currency, Currency> }) {
  const [priceInverted, setPriceInverted] = useState(false)
  const { formatPrice } = useFormatter()
  const { price: currentPrice, quote, base } = calculateInvertedPrice({ price, invert: priceInverted })

  const invertPrice = useCallback(() => {
    setPriceInverted((prev) => !prev)
  }, [setPriceInverted])

  return (
    <Flex gap="$gap8" row alignItems="center">
      <Text variant="body3" color="$neutral2">
        <Trans i18nKey="common.currentPrice.label" />
      </Text>
      <Text variant="body3" color="$neutral1">
        <Trans
          i18nKey="common.amountPerBase"
          values={{
            amount: formatPrice({ price: currentPrice, type: NumberType.TokenTx }),
            symbolA: quote?.symbol,
            symbolB: base?.symbol,
          }}
        />
      </Text>
      <TouchableArea onPress={invertPrice}>
        <ArrowUpDown size="$icon.16" color="$neutral2" rotate="90deg" />
      </TouchableArea>
    </Flex>
  )
}

const InitialPriceInput = () => {
  const colors = useSporeColors()

  const { derivedPositionInfo } = useCreatePositionContext()
  const {
    priceRangeState: { initialPrice, initialPriceInverted },
    setPriceRangeState,
    derivedPriceRangeInfo,
  } = usePriceRangeContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [initialPriceBaseToken, initialPriceQuoteToken] = getInvertedTuple(
    derivedPositionInfo.currencies,
    initialPriceInverted,
  )
  const price = derivedPriceRangeInfo.price

  const controlOptions = useMemo(() => {
    return [{ value: token0?.symbol ?? '' }, { value: token1?.symbol ?? '' }]
  }, [token0?.symbol, token1?.symbol])

  const handleSelectInitialPriceBaseToken = useCallback(
    (option: string) => {
      if (option === token0?.symbol) {
        setPriceRangeState((prevState) => ({ ...prevState, initialPriceInverted: false }))
      } else {
        setPriceRangeState((prevState) => ({ ...prevState, initialPriceInverted: true }))
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
          borderWidth={0}
          borderRadius="$none"
          color="$neutral1"
          fontFamily="$heading"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={initialPrice}
          onChangeText={(text) => setPriceRangeState((prev) => ({ ...prev, initialPrice: text }))}
        />
        <Text variant="body2" color="$neutral2">
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: initialPriceQuoteToken?.symbol,
              symbolB: initialPriceBaseToken?.symbol,
            }}
          />
        </Text>
      </Flex>
      <DisplayCurrentPrice
        price={areCurrenciesEqual(price?.baseCurrency, initialPriceBaseToken) ? price : price?.invert()}
      />
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
}: {
  value: string
  input: RangeSelectionInput
  decrement: () => string
  increment: () => string
  showIncrementButtons?: boolean
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
          borderWidth={0}
          borderRadius="$none"
          color="$neutral1"
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
          <Button theme="secondary" p="$spacing8" borderRadius="$roundedFull" onPress={handleIncrement}>
            <Plus size="16px" color={colors.neutral1.val} />
          </Button>
          <Button
            theme="secondary"
            p="$spacing8"
            borderRadius="$roundedFull"
            color="$neutral1"
            onPress={handleDecrement}
          >
            <Minus size="16px" color={colors.neutral1.val} />
          </Button>
        </Flex>
      )}
    </Flex>
  )
}

export const SelectPriceRangeStepV2 = ({ onContinue, ...rest }: { onContinue: () => void } & FlexProps) => {
  return (
    <Container {...rest}>
      <InitialPriceInput />
      <Button
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
      </Button>
    </Container>
  )
}

export const SelectPriceRangeStep = ({ onContinue, ...rest }: { onContinue: () => void } & FlexProps) => {
  const { t } = useTranslation()

  const {
    positionState: { fee },
    derivedPositionInfo,
  } = useCreatePositionContext()
  const { priceRangeState, setPriceRangeState, derivedPriceRangeInfo } = usePriceRangeContext()

  const [token0, token1] = derivedPositionInfo.currencies
  const [baseCurrency, quoteCurrency] = getInvertedTuple(derivedPositionInfo.currencies, priceRangeState.priceInverted)
  const creatingPoolOrPair = derivedPositionInfo.creatingPoolOrPair

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
  const { ticks, isSorted, prices, pricesAtTicks, ticksAtLimit, invalidPrice, invalidRange } = useMemo(() => {
    if (derivedPriceRangeInfo.protocolVersion === ProtocolVersion.V2) {
      return {
        ticks: undefined,
        isSorted: false,
        prices: undefined,
        pricesAtTicks: undefined,
        ticksAtLimit: [false, false],
        invalidPrice: false,
        invalidRange: false,
      }
    }

    return derivedPriceRangeInfo
  }, [derivedPriceRangeInfo])
  const pool = derivedPositionInfo.protocolVersion === ProtocolVersion.V3 ? derivedPositionInfo.pool : undefined
  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    fee.feeAmount,
    ticks?.[0],
    ticks?.[1],
    pool,
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
    return [
      ticksAtLimit[isSorted ? 0 : 1] ? '0' : prices?.[0]?.toSignificant(8) ?? '',
      ticksAtLimit[isSorted ? 1 : 0] ? '∞' : prices?.[1]?.toSignificant(8) ?? '',
    ]
  }, [isSorted, prices, ticksAtLimit])

  const handleChartRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value, fullRange: false }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value, fullRange: false }))
      }
    },
    [setPriceRangeState],
  )

  const invalidState =
    invalidPrice ||
    invalidRange ||
    (derivedPositionInfo.creatingPoolOrPair &&
      (!priceRangeState.initialPrice || priceRangeState.initialPrice.length === 0))

  if (derivedPositionInfo.protocolVersion === ProtocolVersion.V2) {
    return (
      <Container {...rest}>
        <InitialPriceInput />
        <Button
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
          disabled={invalidState}
        >
          <Text variant="buttonLabel1" color="$surface1">
            <Trans i18nKey="common.button.continue" />
          </Text>
        </Button>
      </Container>
    )
  }

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
          <Trans i18nKey="position.provide.liquidityDescription" />
        </Text>
        <Flex gap="$gap4">
          <Flex
            backgroundColor="$surface2"
            p="$padding16"
            gap="$gap12"
            borderTopLeftRadius="$rounded20"
            borderTopRightRadius="$rounded20"
          >
            <DisplayCurrentPrice price={price} />
            {!creatingPoolOrPair && (
              <LiquidityChartRangeInput
                currencyA={baseCurrency ?? undefined}
                currencyB={quoteCurrency ?? undefined}
                feeAmount={fee.feeAmount}
                ticksAtLimit={{
                  LOWER: ticksAtLimit[0],
                  UPPER: ticksAtLimit[1],
                }}
                price={price ? parseFloat(price.toSignificant(8)) : undefined}
                priceLower={pricesAtTicks?.[0]}
                priceUpper={pricesAtTicks?.[1]}
                onLeftRangeInput={(text) => handleChartRangeInput(RangeSelectionInput.MIN, text)}
                onRightRangeInput={(text) => handleChartRangeInput(RangeSelectionInput.MAX, text)}
                interactive={true}
              />
            )}
          </Flex>
          <Flex row gap="$gap4">
            <RangeInput
              input={RangeSelectionInput.MIN}
              decrement={isSorted ? getDecrementLower : getIncrementUpper}
              increment={isSorted ? getIncrementLower : getDecrementUpper}
              value={rangeSelectionInputValues[0]}
              showIncrementButtons={!!pool}
            />
            <RangeInput
              input={RangeSelectionInput.MAX}
              decrement={isSorted ? getDecrementUpper : getIncrementLower}
              increment={isSorted ? getIncrementUpper : getDecrementLower}
              value={rangeSelectionInputValues[1]}
              showIncrementButtons={!!pool}
            />
          </Flex>
        </Flex>
      </Flex>
      <Button
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
        disabled={invalidState}
      >
        <Text variant="buttonLabel1" color="$surface1">
          {invalidState ? t(`mint.v3.input.invalidPrice.error`) : t(`common.button.continue`)}
        </Text>
      </Button>
    </Container>
  )
}
