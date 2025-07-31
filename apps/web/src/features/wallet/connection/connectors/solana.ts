import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useWallet as useSolanaWalletContext } from '@solana/wallet-adapter-react'
import { SolanaWalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useMemo } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useEvent } from 'utilities/src/react/hooks'
import { sleep } from 'utilities/src/time/timing'

export function useSVMWalletConnectors(): SolanaWalletConnectorMeta[] {
  const solanaWalletContext = useSolanaWalletContext()
  const solanaEnabled = useFeatureFlag(FeatureFlags.Solana)

  return useMemo(() => {
    if (!solanaEnabled) {
      return []
    }

    return solanaWalletContext.wallets.map(({ adapter, readyState }) => {
      const isInjected = readyState === WalletReadyState.Installed
      return {
        name: adapter.name,
        icon: adapter.icon,
        solana: { walletName: adapter.name },
        isInjected,
        // TODO(SWAP-17): get better amplitude type mapping for Solana wallet connectors
        analyticsWalletType: isInjected ? 'Browser Extension' : adapter.name,
      }
    })
  }, [solanaEnabled, solanaWalletContext.wallets])
}

export function useConnectSolanaWallet(): (connector: SolanaWalletConnectorMeta) => Promise<void> {
  const solanaWalletContext = useSolanaWalletContext()

  return useEvent(async (connector: SolanaWalletConnectorMeta) => {
    const adapter = solanaWalletContext.wallets
      .map((wallet) => wallet.adapter)
      .find(({ name }) => name === connector.solana.walletName)

    if (!adapter) {
      throw new Error(`Solana Wallet Adapter not found for wallet ${connector.solana.walletName}`)
    }

    solanaWalletContext.select(connector.solana.walletName)
    // TODO(WEB-8126): Investigate why this is needed
    // adapter.connect() can throw an error if called too soon after solanaWalletContext.select()
    await sleep(10)
    await adapter.connect()
  })
}
