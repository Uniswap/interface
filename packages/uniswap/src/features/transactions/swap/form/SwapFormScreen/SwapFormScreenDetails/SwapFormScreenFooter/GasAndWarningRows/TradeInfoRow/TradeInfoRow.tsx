import { Accordion, Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SwapRateRatio } from 'uniswap/src/features/transactions/swap/components/SwapRateRatio'
import { CanonicalBridgeLinkBanner } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/CanonicalBridgeLinkBanner'
import { GasInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/GasInfoRow'
import { TradeWarning } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeWarning'
import { useDebouncedTrade } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/useDebouncedTrade'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isMobileApp, isWebApp } from 'utilities/src/platform'

// TradeInfoRow take `gasInfo` as a prop (rather than directly using useDebouncedGasInfo) because on mobile,
// the parent needs to check whether to render an empty row based on `gasInfo` fields first.
export function TradeInfoRow({ gasInfo, warning }: { gasInfo: GasInfo; warning?: Warning }): JSX.Element | null {
  // Debounce the trade to prevent flickering on input
  const debouncedTrade = useDebouncedTrade()
  const { text: warningTextColor } = getAlertColor(warning?.severity)
  const { isTestnetModeEnabled } = useEnabledChains()
  const priceUXEnabled = usePriceUXEnabled()

  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)
  const derivedSwapInfo = useSwapFormStoreDerivedSwapInfo((s) => s)

  if (isTestnetModeEnabled) {
    return null
  }

  if (isMobileApp || priceUXEnabled) {
    return <GasInfoRow gasInfo={gasInfo} />
  }

  // On interface, if the warning is a no quotes found warning, we want to show an external link to a canonical bridge

  const inputChainId = currencies.input?.currency.chainId
  const outputChainId = currencies.output?.currency.chainId
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

      {showCanonicalBridge ? (
        <CanonicalBridgeLinkBanner chainId={outputChainId ?? UniverseChainId.Mainnet} />
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
              <RotatableChevron
                animation="fast"
                width={iconSizes.icon16}
                height={iconSizes.icon16}
                direction={open ? 'up' : 'down'}
                color="$neutral3"
              />
            </Flex>
          )}
        </Accordion.Trigger>
      ) : (
        <GasInfoRow gasInfo={gasInfo} />
      )}
    </Flex>
  )
}
