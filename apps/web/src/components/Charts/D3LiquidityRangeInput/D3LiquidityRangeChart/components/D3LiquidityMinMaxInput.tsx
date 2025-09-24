import { D3RangeAmountInput } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3RangeAmountInput'
import { useChartPriceState } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import {
  useLiquidityChartStorePriceDifferences,
  useLiquidityChartStoreRenderingContext,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { useLiquidityChartStoreActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { RangeSelectionInput } from 'components/Liquidity/Create/RangeAmountInput'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useCallback, useState } from 'react'
import { Flex } from 'ui/src'

export function D3LiquidityMinMaxInput() {
  const { ticksAtLimit, setPriceRangeState } = useCreateLiquidityContext()
  const [typedValue, setTypedValue] = useState({ [RangeSelectionInput.MIN]: '', [RangeSelectionInput.MAX]: '' })
  const [displayUserTypedValue, setDisplayUserTypedValue] = useState({
    [RangeSelectionInput.MIN]: false,
    [RangeSelectionInput.MAX]: false,
  })

  const { minPrice, maxPrice, isFullRange } = useChartPriceState()
  const priceDifferences = useLiquidityChartStorePriceDifferences()
  const { liquidityData } = useLiquidityChartStoreRenderingContext() ?? {}
  const { setChartState, decrementMin, incrementMin, decrementMax, incrementMax } = useLiquidityChartStoreActions()

  const absoluteMinPrice = liquidityData?.[0].price0
  const absoluteMaxPrice = liquidityData?.[liquidityData.length - 1].price0

  // Sets chart state but does not update liquidity context
  const handlePriceRangeInput = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setChartState({ minPrice: value && Number(value) ? Number(value) : absoluteMinPrice })
      } else {
        setChartState({ maxPrice: value && Number(value) ? Number(value) : absoluteMaxPrice })
      }

      setTypedValue((prev) => ({ ...prev, [input]: value }))
      setDisplayUserTypedValue((prev) => ({ ...prev, [input]: true }))
    },
    [setChartState, absoluteMinPrice, absoluteMaxPrice],
  )

  // Updates liquidity context
  const onBlur = useCallback(
    (input: RangeSelectionInput, value: string) => {
      if (input === RangeSelectionInput.MIN) {
        setPriceRangeState((prev) => ({ ...prev, minPrice: value }))
      } else {
        setPriceRangeState((prev) => ({ ...prev, maxPrice: value }))
      }

      setDisplayUserTypedValue((prev) => ({ ...prev, [input]: false }))
    },
    [setPriceRangeState],
  )

  return (
    <Flex row gap="$gap4" $lg={{ row: false }}>
      <D3RangeAmountInput
        isDisabled={isFullRange}
        input={RangeSelectionInput.MIN}
        handleDecrement={decrementMin}
        handleIncrement={incrementMin}
        showIncrementButtons={!isFullRange}
        value={ticksAtLimit[0] ? '0' : (minPrice?.toString() ?? '')}
        handlePriceRangeInput={handlePriceRangeInput}
        onBlur={() => onBlur(RangeSelectionInput.MIN, minPrice?.toString() ?? '')}
        typedValue={typedValue[RangeSelectionInput.MIN]}
        displayUserTypedValue={displayUserTypedValue[RangeSelectionInput.MIN]}
        priceDifference={isFullRange ? undefined : priceDifferences?.minPriceDiff}
      />
      <D3RangeAmountInput
        isDisabled={isFullRange}
        input={RangeSelectionInput.MAX}
        handleDecrement={decrementMax}
        handleIncrement={incrementMax}
        showIncrementButtons={!isFullRange}
        value={ticksAtLimit[1] ? '∞' : (maxPrice?.toString() ?? '')}
        handlePriceRangeInput={handlePriceRangeInput}
        onBlur={() => onBlur(RangeSelectionInput.MAX, maxPrice?.toString() ?? '')}
        typedValue={typedValue[RangeSelectionInput.MAX]}
        displayUserTypedValue={displayUserTypedValue[RangeSelectionInput.MAX]}
        priceDifference={isFullRange ? undefined : priceDifferences?.maxPriceDiff}
      />
    </Flex>
  )
}
