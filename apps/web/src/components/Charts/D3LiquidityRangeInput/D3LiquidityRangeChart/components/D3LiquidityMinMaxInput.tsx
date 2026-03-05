import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Token } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { Flex } from 'ui/src'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { D3RangeAmountInput } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3RangeAmountInput'
import { useChartPriceState } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import {
  useLiquidityChartStorePriceDifferences,
  useLiquidityChartStoreRenderingContext,
} from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { TickNavigationParams } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useLiquidityChartStoreActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { RangeSelectionInput } from '~/components/Liquidity/Create/RangeAmountInput'
import { RangeAmountInputPriceMode } from '~/components/Liquidity/Create/types'
import { getBaseAndQuoteCurrencies } from '~/components/Liquidity/utils/currency'
import { getTicksAtLimit, tryParseV4Tick } from '~/components/Liquidity/utils/priceRangeInfo'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { tryParseTick } from '~/state/mint/v3/utils'

// Convert user input to price based on the input mode
function usePercentageToPrice() {
  return useCallback(
    ({
      value,
      inputMode,
      currentPrice,
      fallbackPrice,
    }: {
      value: string
      inputMode: RangeAmountInputPriceMode
      currentPrice: number | undefined
      fallbackPrice: number | undefined
    }): number | undefined => {
      if (inputMode === RangeAmountInputPriceMode.PERCENTAGE && currentPrice) {
        const percent = parseFloat(value)
        if (!isNaN(percent)) {
          const calculatedPrice = currentPrice * (1 + percent / 100)
          return calculatedPrice
        }
        return fallbackPrice
      }

      return value && Number(value) ? Number(value) : fallbackPrice
    },
    [],
  )
}

export function D3LiquidityMinMaxInput() {
  const { setPriceRangeState, priceRangeState, positionState, currencies } = useCreateLiquidityContext()
  const [typedValue, setTypedValue] = useState({ [RangeSelectionInput.MIN]: '', [RangeSelectionInput.MAX]: '' })
  const percentageToPrice = usePercentageToPrice()
  const [displayUserTypedValue, setDisplayUserTypedValue] = useState({
    [RangeSelectionInput.MIN]: false,
    [RangeSelectionInput.MAX]: false,
  })

  const { minPrice, maxPrice, isFullRange, inputMode } = useChartPriceState()
  const priceDifferences = useLiquidityChartStorePriceDifferences()
  const { liquidityData, priceData } = useLiquidityChartStoreRenderingContext() ?? {}
  const { setChartState, decrementMin, incrementMin, decrementMax, incrementMax, toggleInputMode } =
    useLiquidityChartStoreActions()

  const currentPrice = priceData?.[priceData.length - 1]?.value
  const absoluteMinPrice = liquidityData?.[0].price0
  const absoluteMaxPrice = liquidityData?.[liquidityData.length - 1].price0

  // Navigation params for increment/decrement actions
  const tickNavigationParams: TickNavigationParams | undefined = useMemo(() => {
    if (!positionState.fee?.tickSpacing || !currencies.sdk.TOKEN0 || !currencies.sdk.TOKEN1) {
      return undefined
    }

    const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.sdk, priceRangeState.priceInverted)

    return {
      tickSpacing: positionState.fee.tickSpacing,
      feeAmount: positionState.fee.feeAmount,
      baseCurrency,
      quoteCurrency,
      protocolVersion: positionState.protocolVersion,
    }
  }, [positionState.fee, currencies.sdk, priceRangeState.priceInverted, positionState.protocolVersion])

  const ticksAtLimit = useMemo(() => {
    return getTicksAtLimit({
      tickSpacing: positionState.fee?.tickSpacing ?? DEFAULT_TICK_SPACING,
      lowerTick: priceRangeState.minTick,
      upperTick: priceRangeState.maxTick,
      fullRange: isFullRange,
    })
  }, [positionState.fee?.tickSpacing, priceRangeState.minTick, priceRangeState.maxTick, isFullRange])

  // Get display value based on input mode
  const getDisplayValue = useCallback(
    (input: RangeSelectionInput) => {
      if (displayUserTypedValue[input]) {
        return typedValue[input]
      }

      if (inputMode === RangeAmountInputPriceMode.PERCENTAGE) {
        const priceDiff =
          input === RangeSelectionInput.MIN ? priceDifferences?.minPriceDiff : priceDifferences?.maxPriceDiff
        return priceDiff !== undefined ? priceDiff.toFixed(2) : ''
      }

      const price = input === RangeSelectionInput.MIN ? minPrice : maxPrice

      if (input === RangeSelectionInput.MIN && ticksAtLimit[0] && !positionState.initialPosition) {
        return '0'
      }
      if (input === RangeSelectionInput.MAX && ticksAtLimit[1] && !positionState.initialPosition) {
        return '∞'
      }

      return price?.toString() ?? ''
    },
    [
      displayUserTypedValue,
      typedValue,
      inputMode,
      priceDifferences,
      minPrice,
      maxPrice,
      ticksAtLimit,
      positionState.initialPosition,
    ],
  )

  // Sets chart state but does not update liquidity context
  const handlePriceRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      const fallbackPrice = input === RangeSelectionInput.MIN ? absoluteMinPrice : absoluteMaxPrice
      const priceToSet = percentageToPrice({ value, inputMode, currentPrice, fallbackPrice })

      if (input === RangeSelectionInput.MIN) {
        // @ts-expect-error: minPrice can be set here
        setChartState({ minPrice: priceToSet })
      } else {
        // @ts-expect-error: maxPrice can be set here
        setChartState({ maxPrice: priceToSet })
      }

      setTypedValue((prev) => ({ ...prev, [input]: value }))
      setDisplayUserTypedValue((prev) => ({ ...prev, [input]: true }))
    },
    [setChartState, percentageToPrice, absoluteMinPrice, absoluteMaxPrice, inputMode, currentPrice],
  )

  // Updates liquidity context
  const onBlur = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (!tickNavigationParams) {
        return
      }

      let tickToSet: number | undefined
      if (positionState.protocolVersion === ProtocolVersion.V4) {
        tickToSet = tryParseV4Tick({
          baseToken: tickNavigationParams.baseCurrency,
          quoteToken: tickNavigationParams.quoteCurrency,
          value,
          tickSpacing: tickNavigationParams.tickSpacing,
        })
      } else {
        tickToSet = tryParseTick({
          baseToken: tickNavigationParams.baseCurrency as Token,
          quoteToken: tickNavigationParams.quoteCurrency as Token,
          value,
          feeAmount: tickNavigationParams.feeAmount,
        })
      }

      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minTick: tickToSet }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxTick: tickToSet }))
      }

      setDisplayUserTypedValue((prev) => ({ ...prev, [input]: false }))
    },
    [setPriceRangeState, tickNavigationParams, positionState],
  )

  return (
    <Flex row gap="$gap4" $lg={{ row: false }}>
      <D3RangeAmountInput
        isDisabled={isFullRange}
        input={RangeSelectionInput.MIN}
        handleDecrement={() => tickNavigationParams && decrementMin(tickNavigationParams)}
        handleIncrement={() => tickNavigationParams && incrementMin(tickNavigationParams)}
        showIncrementButtons={!isFullRange}
        value={getDisplayValue(RangeSelectionInput.MIN)}
        handlePriceRangeInput={handlePriceRangeInput}
        onBlur={() => onBlur(RangeSelectionInput.MIN, minPrice?.toString() ?? '')}
        typedValue={typedValue[RangeSelectionInput.MIN]}
        displayUserTypedValue={displayUserTypedValue[RangeSelectionInput.MIN]}
        handleInputModeToggle={toggleInputMode}
        price={minPrice}
        priceDifference={isFullRange ? undefined : priceDifferences?.minPriceDiffFormatted}
        inputMode={inputMode}
      />
      <D3RangeAmountInput
        isDisabled={isFullRange}
        input={RangeSelectionInput.MAX}
        handleDecrement={() => tickNavigationParams && decrementMax(tickNavigationParams)}
        handleIncrement={() => tickNavigationParams && incrementMax(tickNavigationParams)}
        showIncrementButtons={!isFullRange}
        value={getDisplayValue(RangeSelectionInput.MAX)}
        handlePriceRangeInput={handlePriceRangeInput}
        onBlur={() => onBlur(RangeSelectionInput.MAX, maxPrice?.toString() ?? '')}
        typedValue={typedValue[RangeSelectionInput.MAX]}
        displayUserTypedValue={displayUserTypedValue[RangeSelectionInput.MAX]}
        handleInputModeToggle={toggleInputMode}
        price={maxPrice}
        priceDifference={isFullRange ? undefined : priceDifferences?.maxPriceDiffFormatted}
        inputMode={inputMode}
      />
    </Flex>
  )
}
