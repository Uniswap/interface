import { DeadlineOverride } from 'pages/Swap/settings/DeadlineOverride'
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
  const batchSwapEnabled = useFeatureFlag(FeatureFlags.BatchedSwaps)
  const isAtomicBatchingSupported = useAppSelector(selectIsAtomicBatchingSupported)

  return useMemo(() => {
    const canBatch = batchSwapEnabled && isAtomicBatchingSupported
    if (!canBatch) {
      return DEFAULT_SETTINGS
    }

    return [...DEFAULT_SETTINGS, OneClickSwap]
  }, [batchSwapEnabled, isAtomicBatchingSupported])
}
