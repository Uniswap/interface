import { DeadlineOverride } from 'pages/Swap/settings/DeadlineOverride'
import { MetaAggregator } from 'pages/Swap/settings/MetaAggregator'
import { OneClickSwap } from 'pages/Swap/settings/OneClickSwap'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { selectIsAtomicBatchingSupported } from 'state/walletCapabilities/reducer'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'

const DEFAULT_SETTINGS = [Slippage, DeadlineOverride, TradeRoutingPreference]

export function useWebSwapSettings() {
  const metaAggregator = useFeatureFlag(FeatureFlags.MetaAggregator)
  const batchSwapEnabled = useFeatureFlag(FeatureFlags.BatchedSwaps)
  const isAtomicBatchingSupported = useAppSelector(selectIsAtomicBatchingSupported)

  return useMemo(() => {
    const settings = [...DEFAULT_SETTINGS]

    if (metaAggregator) {
      settings.push(MetaAggregator)
    }

    const canBatch = batchSwapEnabled && isAtomicBatchingSupported
    if (canBatch) {
      settings.push(OneClickSwap)
    }

    return settings
  }, [batchSwapEnabled, isAtomicBatchingSupported, metaAggregator])
}
