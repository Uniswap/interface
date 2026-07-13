import { isMobileApp, isWebApp } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Accordion, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { CanonicalBridgeLinkBanner } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/CanonicalBridgeLinkBanner'
import { GasInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow'
import { GasInfoRowWithCustomGasEnabled } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRowWithCustomGasEnabled'
import { TradeWarning } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeWarning'
import { useDebouncedTrade } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/useDebouncedTrade'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

// TradeInfoRow take `gasInfo` as a prop (rather than directly using useDebouncedGasInfo) because on mobile,
// the parent needs to check whether to render an empty row based on `gasInfo` fields first.
export function TradeInfoRow({ gasInfo, warning }: { gasInfo: GasInfo; warning?: Warning }): JSX.Element | null {
  // Debounce the trade to prevent flickering on input
  const debouncedTrade = useDebouncedTrade()
  const { text: warningTextColor } = getAlertColor(warning?.severity)
  const { isTestnetModeEnabled } = useEnabledChains()

  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)
  const derivedSwapInfo = useSwapFormStoreDerivedSwapInfo((s) => s)
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()

  if (isTestnetModeEnabled) {
    return null
  }

  if (isMobileApp) {
    // Only swap to the tappable chip when the user has opted into custom entry.
    // Otherwise we keep the <GasInfoRow> + NetworkFeeWarning tooltip pair.
    return isGasFeeOverridesEnabled && enableCustomGasFeeEntry ? (
      <GasInfoRowWithCustomGasEnabled gasInfo={gasInfo} />
    ) : (
      <GasInfoRow gasInfo={gasInfo} />
    )
  }

  // On interface, if the warning is a no quotes found warning, we want to show an external link to a canonical bridge

  const inputChainId = currencies.input?.currency.chainId
  const outputChainId = currencies.output?.currency.chainId
  // Prefer the output chain's canonical bridge, falling back to the input chain's — L1s like mainnet have none
  const bridgeChainId = [outputChainId, inputChainId].find(
    (chainId): chainId is UniverseChainId => chainId !== undefined && getChainInfo(chainId).bridge !== undefined,
  )
  const showCanonicalBridge = isWebApp && warning?.type === WarningLabel.NoQuotesFound && inputChainId !== outputChainId

  return (
    <Flex centered row>
      <Flex fill>
        {debouncedTrade && !warning && (
          <SwapRateRatio
            initialInverse={true}
            styling="secondary"
            trade={debouncedTrade}
            derivedSwapInfo={derivedSwapInfo}
          />
        )}

        {warning && (
          <TradeWarning warning={warning}>
            <Flex row centered gap="$gap8">
              <AlertTriangleFilled color={warningTextColor} size="$icon.20" />
              <Text color={warningTextColor} variant="body3">
                {warning.title}
              </Text>
            </Flex>
          </TradeWarning>
        )}
      </Flex>

      {showCanonicalBridge && bridgeChainId ? (
        <CanonicalBridgeLinkBanner chainId={bridgeChainId} />
      ) : debouncedTrade ? (
        <Accordion.Trigger
          p="$none"
          style={{ background: '$surface1' }}
          focusStyle={{ background: '$surface1' }}
          hoverStyle={{ background: '$surface1' }}
        >
          {({ open }: { open: boolean }) => (
            <Flex row gap="$spacing4" alignItems="center">
              <GasInfoRow gasInfo={gasInfo} hidden={open} />
              {open ? (
                <ChevronsIn size="$icon.20" color="$neutral2" />
              ) : (
                <ChevronsOut size="$icon.20" color="$neutral2" />
              )}
            </Flex>
          )}
        </Accordion.Trigger>
      ) : (
        <GasInfoRow gasInfo={gasInfo} />
      )}
    </Flex>
  )
}
