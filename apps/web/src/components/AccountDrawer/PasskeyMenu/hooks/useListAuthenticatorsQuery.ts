import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import type { Authenticator, RecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { AuthenticatorNameType, listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useSessionStoragePersistedQuery } from 'utilities/src/reactQuery/useSessionStoragePersistedQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { AuthenticatorProvider, getProvider, getProviderLabel } from '~/components/Passkey/authenticatorProvider'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

export function getListAuthenticatorsStorageKey(walletId: string | null | undefined): string {
  return `listAuth:${walletId ?? ''}`
}

export type AuthenticatorDisplay = Pick<Authenticator, 'credentialId' | 'providerName' | 'createdAt' | 'aaguid'> & {
  provider: AuthenticatorProvider
  label: string
}

function convertAuthenticatorsToDisplay(
  authenticators: Authenticator[],
  nameType: typeof AuthenticatorNameType,
): AuthenticatorDisplay[] {
  let otherPasskeyCount = 1
  return authenticators.map((authenticator) => {
    const provider = getProvider(authenticator.providerName, nameType)
    const isOtherPasskey = provider === AuthenticatorProvider.Other
    const label = getProviderLabel(provider, otherPasskeyCount)
    isOtherPasskey && otherPasskeyCount++
    return {
      // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
      ...authenticator,
      provider,
      label,
    }
  })
}

type ListAuthenticatorsQueryResult = {
  authenticators: AuthenticatorDisplay[]
  recoveryMethods: RecoveryMethod[]
  lastExportedMs?: number
}

export function useListAuthenticatorsQuery({
  skipIfNoSessionOrCache = false,
}: { skipIfNoSessionOrCache?: boolean } = {}) {
  const { walletId } = useEmbeddedWalletState()
  const queryClient = useQueryClient()

  // Mirror to sessionStorage so the cache survives the top-level OAuth redirect.
  // Without this, the post-redirect refetch loses the in-memory NECK and re-prompts
  // for the passkey to derive a fresh one.
  useSessionStoragePersistedQuery({
    queryKey: [ReactQueryCacheKey.ListAuthenticators, walletId],
    storageKey: getListAuthenticatorsStorageKey(walletId),
    enabled: !!walletId,
  })

  // Gate the fetch on (NECK in memory || cache hit) when the caller opts in:
  // listAuthenticators triggers a passkey prompt if no live NECK, so for
  // ambient surfaces we only want to query when it'll be silent. Cache lookup
  // runs after the sessionStorage hydration above, so a persisted entry counts.
  const hasSessionOrCache =
    !!walletId &&
    (hasActiveNeckKey(walletId) ||
      queryClient.getQueryData<ListAuthenticatorsQueryResult>([ReactQueryCacheKey.ListAuthenticators, walletId]) !==
        undefined)

  return useQuery<ListAuthenticatorsQueryResult>({
    queryKey: [ReactQueryCacheKey.ListAuthenticators, walletId],
    queryFn: async () => {
      const result = await listAuthenticators(walletId ?? undefined)
      const display = convertAuthenticatorsToDisplay(result.authenticators, AuthenticatorNameType)
      display.sort((a, b) => {
        const aTime = Number(a.createdAt) || 0
        const bTime = Number(b.createdAt) || 0
        return aTime - bTime
      })
      return {
        authenticators: display,
        recoveryMethods: result.recoveryMethods,
        lastExportedMs: result.lastExportedMs,
      }
    },
    enabled: !!walletId && (!skipIfNoSessionOrCache || hasSessionOrCache),
    staleTime: 20 * ONE_MINUTE_MS,
  })
}
