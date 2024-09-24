import { useCreatePositionContext, usePriceRangeContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { Container } from 'pages/Pool/Positions/create/shared'
import { useCallback, useMemo } from 'react'
import { Minus, Plus } from 'react-feather'
import { Button, Flex, SegmentedControl, Text, useSporeColors } from 'ui/src'
import { SwapActionButton } from 'ui/src/components/icons/SwapActionButton'
import { fonts } from 'ui/src/theme'
import { AmountInput } from 'uniswap/src/components/CurrencyInputPanel/AmountInput'
import { Trans, useTranslation } from 'uniswap/src/i18n'

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

function RangeInput({ input }: { input: RangeSelectionInput }) {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const {
    positionState: {
      tokenInputs: { TOKEN0: token0, TOKEN1: token1 },
    },
  } = useCreatePositionContext()
  const {
    priceRangeState: { minPrice, maxPrice, priceInverted },
    setPriceRangeState,
  } = usePriceRangeContext()

  const baseCurrency = priceInverted ? token1 : token0
  const quoteCurrency = priceInverted ? token0 : token1

  const handlePriceRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value }))
      }
    },
    [setPriceRangeState],
  )

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
          fontFamily="$heading3"
          fontSize={fonts.heading3.fontSize}
          fontWeight={fonts.heading3.fontWeight}
          maxDecimals={quoteCurrency?.decimals ?? 18}
          overflow="visible"
          placeholder="0"
          placeholderTextColor={colors.neutral3.val}
          px="$none"
          py="$none"
          value={input === RangeSelectionInput.MIN ? minPrice : maxPrice}
          onChangeText={(text) => handlePriceRangeInput(input, text)}
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
      <Flex gap={10}>
        <Button theme="secondary" p="$spacing8" borderRadius="$roundedFull">
          <Plus size="16px" color={colors.neutral1.val} />
        </Button>
        <Button theme="secondary" p="$spacing8" borderRadius="$roundedFull" color="$neutral1">
          <Minus size="16px" color={colors.neutral1.val} />
        </Button>
      </Flex>
    </Flex>
  )
}

export const SelectPriceRangeStep = ({ onContinue }: { onContinue: () => void }) => {
  const { t } = useTranslation()

  const {
    positionState: {
      tokenInputs: { TOKEN0: token0, TOKEN1: token1 },
    },
  } = useCreatePositionContext()
  const {
    priceRangeState: { priceInverted, fullRange },
    setPriceRangeState,
  } = usePriceRangeContext()

  const baseCurrency = priceInverted ? token1 : token0
  const quoteCurrency = priceInverted ? token0 : token1

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

  const handleSelectRange = useCallback(
    (option: RangeSelection) => {
      if (option === RangeSelection.FULL) {
        setPriceRangeState((prevState) => ({ ...prevState, fullRange: true }))
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

  return (
    <Container>
      <Flex gap="$gap20">
        <Flex row alignItems="center">
          <Text flex={1} variant="subheading1">
            <Trans i18nKey="position.selectRange" />
          </Text>
          <SegmentedControl
            options={controlOptions}
            selectedOption={baseCurrency?.symbol ?? ''}
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
                  // TODO: update values after WEB-4920
                  values={{
                    amount: '329,394,000.00',
                    symbolA: quoteCurrency?.symbol,
                    symbolB: baseCurrency?.symbol,
                  }}
                />
              </Text>
              <SwapActionButton size="$icon.16" color="$neutral2" />
            </Flex>
          </Flex>
          <Flex row gap="$gap4">
            <RangeInput input={RangeSelectionInput.MIN} />
            <RangeInput input={RangeSelectionInput.MAX} />
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
