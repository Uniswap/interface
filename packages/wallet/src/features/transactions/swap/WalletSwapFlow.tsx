import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/components/settings/slice'
import { SwapFlow, type SwapFlowProps } from 'uniswap/src/features/transactions/swap/SwapFlow'
import { SwapDependenciesContextProvider } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContextProvider'
import { SwapFormContextProvider } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { TradeRoutingPreference } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/TradeRoutingPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/Slippage/Slippage'
import { useSwapCallback } from 'wallet/src/features/transactions/swap/hooks/useSwapCallback'
import { useWrapCallback } from 'wallet/src/features/transactions/swap/hooks/useWrapCallback'
import { SwapProtection } from 'wallet/src/features/transactions/swap/settings/SwapProtection'

type WalletSwapFlowProps = Omit<SwapFlowProps, 'settings' | 'swapCallback' | 'wrapCallback'> & {
  onSubmitSwap?: () => Promise<void>
}

const SETTINGS: SwapFlowProps['settings'] = [Slippage, SwapProtection, TradeRoutingPreference]

export function WalletSwapFlow({ onSubmitSwap, ...props }: WalletSwapFlowProps): JSX.Element {
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  return (
    <TransactionSettingsContextProvider settingKey={TransactionSettingKey.Swap}>
      <SwapFormContextProvider
        prefilledState={props.prefilledState}
        hideSettings={props.hideHeader}
        hideFooter={props.hideFooter}
      >
        <SwapDependenciesContextProvider swapCallback={swapCallback} wrapCallback={wrapCallback}>
          <SwapFlow {...props} settings={SETTINGS} onSubmitSwap={onSubmitSwap} />
        </SwapDependenciesContextProvider>
      </SwapFormContextProvider>
    </TransactionSettingsContextProvider>
  )
}
