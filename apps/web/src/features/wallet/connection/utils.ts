import { WalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'

/**
 * Compares a WalletConnectorMeta object against a string identifier.
 * Returns true if the meta object has any of its connector IDs matching the compareTo string.
 */
export const isEqualWalletConnectorMetaId = (meta: WalletConnectorMeta, compareTo: string) => {
  return meta.wagmi?.id === compareTo || meta.customConnectorId === compareTo || meta.solana?.walletName === compareTo
}

export function getConnectorWithId({
  connectors,
  id,
}: {
  connectors: WalletConnectorMeta[]
  id: string
}): WalletConnectorMeta | undefined {
  return connectors.find((c) => c.wagmi?.id === id || c.customConnectorId === id || c.solana?.walletName === id)
}

export function getConnectorWithIdWithThrow({
  connectors,
  id,
}: {
  connectors: WalletConnectorMeta[]
  id: string
}): WalletConnectorMeta {
  const connector = getConnectorWithId({ connectors, id })
  if (!connector) {
    throw new Error(`Expected connector ${id} missing from connectors array.`)
  }
  return connector
}
