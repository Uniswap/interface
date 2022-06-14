import { coinbaseWalletHooks, fortmaticHooks, injectedHooks, Wallet, walletConnectHooks } from 'connectors'
import { useMemo } from 'react'

export default function useIsActiveMap(): Map<Wallet, boolean> {
  const injectedIsActive = injectedHooks.useIsActive()
  const coinbaseWalletIsActive = coinbaseWalletHooks.useIsActive()
  const walletConnectIsActive = walletConnectHooks.useIsActive()
  const fortmaticIsActive = fortmaticHooks.useIsActive()
  return useMemo(() => {
    return new Map([
      [Wallet.INJECTED, injectedIsActive],
      [Wallet.COINBASE_WALLET, coinbaseWalletIsActive],
      [Wallet.WALLET_CONNECT, walletConnectIsActive],
      [Wallet.FORTMATIC, fortmaticIsActive],
    ])
  }, [injectedIsActive, coinbaseWalletIsActive, walletConnectIsActive, fortmaticIsActive])
}
