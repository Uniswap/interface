import { SwapDeadline } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/SwapDeadline'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import { Slippage } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { SwapDependenciesStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContextProvider'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import { SwapFlow, type SwapFlowProps } from 'uniswap/src/features/transactions/swap/SwapFlow/SwapFlow'
import { useSwapHandlers } from 'wallet/src/features/transactions/swap/hooks/useSwapHandlers'
import { SwapProtection } from 'wallet/src/features/transactions/swap/settings/SwapProtection'

type WalletSwapFlowProps = Omit<SwapFlowProps, 'settings'> & {
  onSubmitSwap?: () => Promise<void>
}

const SETTINGS: SwapFlowProps['settings'] = [Slippage, SwapProtection, TradeRoutingPreference, SwapDeadline]

export function WalletSwapFlow(props: WalletSwapFlowProps): JSX.Element {
  return (
    <SwapTransactionSettingsStoreContextProvider>
      <SwapFormStoreContextProvider prefilledState={props.prefilledState} hideFooter={props.hideFooter}>
        <WalletSwapFlowInner {...props} />
      </SwapFormStoreContextProvider>
    </SwapTransactionSettingsStoreContextProvider>
  )
}

// `useSwapHandlers` reads from the swap form store, so it must be called inside
// `SwapFormStoreContextProvider` — calling it in `WalletSwapFlow` itself crashes the flow.
function WalletSwapFlowInner(props: WalletSwapFlowProps): JSX.Element {
  const swapHandlers = useSwapHandlers()

  return (
    <SwapDependenciesStoreContextProvider swapHandlers={swapHandlers}>
      <SwapFlow {...props} settings={SETTINGS} />
    </SwapDependenciesStoreContextProvider>
  )
}
