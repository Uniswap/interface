import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react'
import { createLiquidityChartStore } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { LiquidityChartStoreContext } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { useLiquidityChartStoreActions } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { RangeAmountInputPriceMode } from '~/components/Liquidity/Create/types'

interface LiquidityChartStoreProviderProps {
  tickSpacing: number
  inputMode?: RangeAmountInputPriceMode
  children: ReactNode
  minTick?: number
  maxTick?: number
  isFullRange?: boolean
  baseCurrency: Maybe<Currency>
  quoteCurrency: Maybe<Currency>
  priceInverted: boolean
  protocolVersion: ProtocolVersion
  selectedHistoryDuration: GraphQLApi.HistoryDuration
  onChartError: (error: string) => void
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
  onMinTickChange: (tick?: number) => void
  onMaxTickChange: (tick?: number) => void
  onTimePeriodChange?: (timePeriod: GraphQLApi.HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}

function LiquidityChartStoreProviderInner({
  children,
  minTick,
  maxTick,
  isFullRange,
}: PropsWithChildren<Pick<LiquidityChartStoreProviderProps, 'minTick' | 'maxTick' | 'isFullRange'>>) {
  const store = useContext(LiquidityChartStoreContext)
  const { syncIsFullRangeFromParent } = useLiquidityChartStoreActions()

  // Sync minTick and maxTick
  useEffect(() => {
    if (isFullRange || !store) {
      return
    }

    store.setState({
      minTick,
      maxTick,
    })
  }, [minTick, maxTick, isFullRange, store])

  // Sync isFullRange
  useEffect(() => {
    syncIsFullRangeFromParent(isFullRange ?? false)
  }, [isFullRange, syncIsFullRangeFromParent])

  return children
}

export function LiquidityChartStoreProvider({
  children,
  inputMode,
  minTick,
  maxTick,
  tickSpacing,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
  isFullRange,
  selectedHistoryDuration,
  onChartError,
  onInputModeChange,
  onMinTickChange,
  onMaxTickChange,
  onTimePeriodChange,
  setIsFullRange,
}: LiquidityChartStoreProviderProps) {
  const [store] = useState(() =>
    createLiquidityChartStore({
      inputMode,
      minTick,
      maxTick,
      tickSpacing,
      baseCurrency,
      quoteCurrency,
      priceInverted,
      protocolVersion,
      isFullRange,
      selectedHistoryDuration,
      onChartError,
      onInputModeChange,
      onMinTickChange,
      onMaxTickChange,
      onTimePeriodChange,
      setIsFullRange,
    }),
  )

  return (
    <LiquidityChartStoreContext.Provider value={store}>
      <LiquidityChartStoreProviderInner minTick={minTick} maxTick={maxTick} isFullRange={isFullRange}>
        {children}
      </LiquidityChartStoreProviderInner>
    </LiquidityChartStoreContext.Provider>
  )
}
