import { ReactNode, useState } from 'react'
import { createHorizontalLiquidityChartStore } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/createHorizontalLiquidityChartStore'
import { HorizontalLiquidityChartStoreContext } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/HorizontalLiquidityChartStoreContext'

export function HorizontalLiquidityChartStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createHorizontalLiquidityChartStore())
  return (
    <HorizontalLiquidityChartStoreContext.Provider value={store}>
      {children}
    </HorizontalLiquidityChartStoreContext.Provider>
  )
}
