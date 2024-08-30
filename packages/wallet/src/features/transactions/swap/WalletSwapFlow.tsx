import { SwapFlow, SwapFlowProps } from 'wallet/src/features/transactions/swap/SwapFlow'
import { SwapProtection } from 'wallet/src/features/transactions/swap/modals/settings/configs/SwapProtection'

type WalletSwapFlowProps = Omit<SwapFlowProps, 'customSettings'>

const WALLET_CUSTOM_SWAP_SETTINGS = [SwapProtection]

export function WalletSwapFlow({ ...props }: WalletSwapFlowProps): JSX.Element {
  return <SwapFlow {...props} customSettings={WALLET_CUSTOM_SWAP_SETTINGS} />
}
