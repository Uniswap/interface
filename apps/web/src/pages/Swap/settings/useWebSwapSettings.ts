import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { DeadlineOverride } from 'pages/Swap/settings/DeadlineOverride'
import { OneClickSwap } from 'pages/Swap/settings/OneClickSwap'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { selectIsAtomicBatchingSupported } from 'state/walletCapabilities/reducer'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { filterSettingsByPlatform } from 'uniswap/src/features/transactions/components/settings/utils'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'

const DEFAULT_SETTINGS = [Slippage, DeadlineOverride, TradeRoutingPreference]

export function useWebSwapSettings() {
  const batchSwapEnabled = useFeatureFlag(FeatureFlags.BatchedSwaps)
  const isAtomicBatchingSupported = useAppSelector(selectIsAtomicBatchingSupported)
  const { chainId } = useMultichainContext()

  return useMemo(() => {
    const canBatch = batchSwapEnabled && isAtomicBatchingSupported
    const allSettings = canBatch ? [...DEFAULT_SETTINGS, OneClickSwap] : DEFAULT_SETTINGS

    // Filter settings based on current platform
    if (chainId) {
      const platform = chainIdToPlatform(chainId)
      return filterSettingsByPlatform(allSettings, platform)
    }

    // If no chainId, return all settings (fallback)
    return allSettings
  }, [batchSwapEnabled, isAtomicBatchingSupported, chainId])
}
