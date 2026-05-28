import { useQuery } from '@tanstack/react-query'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { hasActiveNeckKey, loadNeckMetadata } from 'uniswap/src/features/passkey/deviceSession'
import { PasskeyAuthStatus } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useGetPasskeyAuthStatus(connectionType: string | undefined): PasskeyAuthStatus {
  const isSignedInWithPasskey = connectionType === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID

  // Initial value requires BOTH: metadata in localStorage AND the in-memory CryptoKey.
  // Metadata survives window close but the key does not, so a metadata-only check
  // would falsely report an active session on fresh page loads. Signing flows overwrite
  // this via SharedQueryClient.setQueryData with the actual sessionActive from Challenge.
  const { data: isSessionAuthenticated = false } = useQuery({
    queryKey: [ReactQueryCacheKey.PasskeyAuthStatus, isSignedInWithPasskey],
    queryFn: () => {
      const meta = loadNeckMetadata()
      if (!meta) {
        return false
      }
      return hasActiveNeckKey(meta.walletId)
    },
    enabled: isSignedInWithPasskey,
  })

  return {
    isSignedInWithPasskey,
    isSessionAuthenticated,
    needsPasskeySignin: isSignedInWithPasskey && !isSessionAuthenticated,
  }
}
