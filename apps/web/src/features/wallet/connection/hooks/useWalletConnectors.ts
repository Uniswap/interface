import { applyCustomConnectorMeta } from 'features/wallet/connection/connectors/custom'
import { deduplicateWalletConnectorMeta } from 'features/wallet/connection/connectors/multiplatform'
import { useSVMWalletConnectors } from 'features/wallet/connection/connectors/solana'
import { useWagmiWalletConnectors } from 'features/wallet/connection/connectors/wagmi'
import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useMemo } from 'react'

export function useWalletConnectors(): WalletConnectorMeta[] {
  const wagmiWalletConnectors = useWagmiWalletConnectors()
  const solanaWalletConnectors = useSVMWalletConnectors()

  return useMemo(() => {
    return applyCustomConnectorMeta(
      deduplicateWalletConnectorMeta([...wagmiWalletConnectors, ...solanaWalletConnectors]),
    )
  }, [wagmiWalletConnectors, solanaWalletConnectors])
}
