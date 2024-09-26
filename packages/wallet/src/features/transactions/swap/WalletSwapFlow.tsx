import { SwapFlow, SwapFlowProps } from 'uniswap/src/features/transactions/swap/SwapFlow'
import { useSwapCallback } from 'wallet/src/features/transactions/swap/hooks/useSwapCallback'
import { useWrapCallback } from 'wallet/src/features/transactions/swap/hooks/useWrapCallback'
import { SwapProtection } from 'wallet/src/features/transactions/swap/settings/SwapProtection'

type WalletSwapFlowProps = Omit<SwapFlowProps, 'customSettings' | 'swapCallback' | 'wrapCallback'>

const WALLET_CUSTOM_SWAP_SETTINGS = [SwapProtection]

export function WalletSwapFlow(props: WalletSwapFlowProps): JSX.Element {
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  return (
    <SwapFlow
      {...props}
      customSettings={WALLET_CUSTOM_SWAP_SETTINGS}
      swapCallback={swapCallback}
      wrapCallback={wrapCallback}
    />
  )
}
