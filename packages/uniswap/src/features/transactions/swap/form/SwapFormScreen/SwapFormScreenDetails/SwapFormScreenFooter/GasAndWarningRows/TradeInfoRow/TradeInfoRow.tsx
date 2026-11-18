import type { UniverseChainId } from '@universe/chains'
import { isMobileApp, isWebApp } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { GasRow, WarningLine } from '@universe/transactions-ui'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { toWarningLevel } from 'uniswap/src/components/modals/WarningModal/utils'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { CanonicalBridgeLinkBanner } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/CanonicalBridgeLinkBanner'
import { GasInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow'
import { GasInfoRowWithCustomGasEnabled } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRowWithCustomGasEnabled'
import { TradeWarning } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeWarning'
import { useDebouncedTrade } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/useDebouncedTrade'
import type {
  DetailsExpandedProps,
  GasInfo,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

// TradeInfoRow take `gasInfo` as a prop (rather than directly using useDebouncedGasInfo) because on mobile,
// the parent needs to check whether to render an empty row based on `gasInfo` fields first.
export function TradeInfoRow({
  bridgeChainId,
  gasInfo,
  warning,
  detailsExpanded,
  onDetailsExpandedChange,
}: {
  bridgeChainId?: UniverseChainId
  gasInfo: GasInfo
  warning?: Warning
} & DetailsExpandedProps): JSX.Element | null {
  // Debounce the trade to prevent flickering on input
  const debouncedTrade = useDebouncedTrade()
  const { isTestnetModeEnabled } = useEnabledChains()

  const derivedSwapInfo = useSwapFormStoreDerivedSwapInfo((s) => s)
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()

  if (isTestnetModeEnabled) {
    return null
  }

  if (isMobileApp) {
    if (bridgeChainId !== undefined) {
      return <CanonicalBridgeLinkBanner chainId={bridgeChainId} />
    }

    // Only swap to the tappable chip when the user has opted into custom entry.
    // Otherwise we keep the <GasInfoRow> + NetworkFeeWarning tooltip pair.
    return isGasFeeOverridesEnabled && enableCustomGasFeeEntry ? (
      <GasInfoRowWithCustomGasEnabled gasInfo={gasInfo} />
    ) : (
      <GasInfoRow gasInfo={gasInfo} />
    )
  }

  // On interface, if the warning is a no quotes found warning, we want to show an external link to a canonical bridge
  const showCanonicalBridge = isWebApp && bridgeChainId !== undefined

  return (
    <GasRow
      leading={
        warning ? (
          <TradeWarning warning={warning}>
            <WarningLine layout="start" level={toWarningLevel(warning.severity)} message={warning.title} />
          </TradeWarning>
        ) : debouncedTrade ? (
          <SwapRateRatio
            initialInverse={true}
            styling="secondary"
            trade={debouncedTrade}
            derivedSwapInfo={derivedSwapInfo}
          />
        ) : undefined
      }
      // The gas hides while the details are open; they repeat it as the network cost row.
      gasSummary={<GasInfoRow gasInfo={gasInfo} hidden={debouncedTrade ? detailsExpanded : undefined} />}
      trailing={showCanonicalBridge ? <CanonicalBridgeLinkBanner chainId={bridgeChainId} /> : undefined}
      expanded={detailsExpanded}
      // No trade, no details to show: the gas renders without the toggle.
      onExpandedChange={debouncedTrade ? onDetailsExpandedChange : undefined}
    />
  )
}
