import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useMemo, useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { useRangeHopCallbacks } from 'state/mint/v3/hooks'
import { Button, Flex, FlexProps, SegmentedControl, Text, useSporeColors } from 'ui/src'
import { SwapActionButton } from 'ui/src/components/icons/SwapActionButton'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { NumberType, useFormatter } from 'utils/formatNumbers'

enum RangeSelectionInput {
  MIN,
  MAX,
}

enum RangeSelection {
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

function RangeControl({ value, active }: { value: string; active: boolean }) {
  return (
    <Text color={active ? '$neutral1' : '$neutral2'} userSelect="none" variant="buttonLabel3">
      {value}
    </Text>
  )
}

function RangeInput({
  value,
  input,
  decrement,
  increment,
}: {
  value: string
  input: RangeSelectionInput
  decrement: () => string
  increment: () => string
}) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const {
    setPriceRangeState,
    derivedPriceRangeInfo: { baseAndQuoteTokens },
  } = usePriceRangeContext()

  const [typedValue, setTypedValue] = useState('')
  const [baseToken, quoteToken] = baseAndQuoteTokens ?? [undefined, undefined]
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
          maxDecimals={quoteToken?.decimals ?? 18}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={displayUserTypedValue ? typedValue : value}
          onChangeText={(text) => handlePriceRangeInput(input, text)}
          onBlur={() => setDisplayUserTypedValue(false)}
        />
        <Text variant="body3" color="$neutral2">
          <Trans
            i18nKey="common.feesEarnedPerBase"
            values={{
              symbolA: quoteToken?.symbol,
              symbolB: baseToken?.symbol,
            }}
          />
        </Text>
      </Flex>
      <Flex gap={10}>
        <Button theme="secondary" p="$spacing8" borderRadius="$roundedFull" onPress={handleIncrement}>
          <Plus size="16px" color={colors.neutral1.val} />
        </Button>
        <Button theme="secondary" p="$spacing8" borderRadius="$roundedFull" color="$neutral1" onPress={handleDecrement}>
          <Minus size="16px" color={colors.neutral1.val} />
        </Button>
      </Flex>
    </Flex>
  )
}

export const SelectPriceRangeStep = ({ onContinue, ...rest }: { onContinue: () => void } & FlexProps) => {
  const { t } = useTranslation()
  const { formatPrice } = useFormatter()

  const {
    positionState: {
      currencyInputs: { TOKEN0: token0, TOKEN1: token1 },
      fee,
    },
    derivedPositionInfo: { pool },
  } = useCreatePositionContext()
  const {
    priceRangeState: { fullRange },
    setPriceRangeState,
    derivedPriceRangeInfo: { baseAndQuoteTokens, price, prices, ticks, isSorted, ticksAtLimit },
  } = usePriceRangeContext()

  const [baseToken, quoteToken] = baseAndQuoteTokens ?? [undefined, undefined]

  const controlOptions = useMemo(() => {
    return [{ value: token0?.symbol ?? '' }, { value: token1?.symbol ?? '' }]
  }, [token0?.symbol, token1?.symbol])

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

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    baseToken ?? undefined,
    quoteToken ?? undefined,
    fee,
    ticks?.[0],
    ticks?.[1],
    pool,
  )

  const handleSelectRange = useCallback(
    (option: RangeSelection) => {
      if (option === RangeSelection.FULL) {
        setPriceRangeState((prevState) => ({
          ...prevState,
          fullRange: true,
        }))
      } else {
        setPriceRangeState((prevState) => ({ ...prevState, fullRange: false }))
      }
    },
    [setPriceRangeState],
  )

  const segmentedControlRangeOptions = [
    { display: <RangeControl value={t(`common.fullRange`)} active={fullRange} />, value: RangeSelection.FULL },
    { display: <RangeControl value={t(`common.customRange`)} active={!fullRange} />, value: RangeSelection.CUSTOM },
  ]

  const rangeSelectionInputValues = useMemo(() => {
    return [
      ticksAtLimit[isSorted ? 0 : 1] ? '0' : prices?.[0]?.toSignificant(8) ?? '',
      ticksAtLimit[isSorted ? 1 : 0] ? '∞' : prices?.[1]?.toSignificant(8) ?? '',
    ]
  }, [isSorted, prices, ticksAtLimit])

  return (
    <Container {...rest}>
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.selectRange" />
          </Text>
          <SegmentedControl
            options={controlOptions}
            selectedOption={baseToken?.symbol ?? ''}
            onSelectOption={handleSelectToken}
          />
        </Flex>
        <SegmentedControl
          options={segmentedControlRangeOptions}
          selectedOption={fullRange ? RangeSelection.FULL : RangeSelection.CUSTOM}
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
            <Flex gap="$gap8" row alignItems="center">
              <Text variant="body3" color="$neutral2">
                <Trans i18nKey="common.currentPrice.label" />
              </Text>
              <Text variant="body3" color="$neutral1">
                <Trans
                  i18nKey="common.amountPerBase"
                  values={{
                    amount: formatPrice({ price, type: NumberType.TokenTx }),
                    symbolA: quoteToken?.symbol,
                    symbolB: baseToken?.symbol,
                  }}
                />
              </Text>
              <SwapActionButton size="$icon.16" color="$neutral2" />
            </Flex>
          </Flex>
          <Flex row gap="$gap4">
            <RangeInput
              input={RangeSelectionInput.MIN}
              decrement={isSorted ? getDecrementLower : getIncrementUpper}
              increment={isSorted ? getIncrementLower : getDecrementUpper}
              value={rangeSelectionInputValues[0]}
            />
            <RangeInput
              input={RangeSelectionInput.MAX}
              decrement={isSorted ? getDecrementUpper : getIncrementLower}
              increment={isSorted ? getIncrementUpper : getDecrementLower}
              value={rangeSelectionInputValues[1]}
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
      >
        <Text variant="buttonLabel1" color="$surface1">
          <Trans i18nKey="common.button.continue" />
        </Text>
      </Button>
    </Container>
  )
}
