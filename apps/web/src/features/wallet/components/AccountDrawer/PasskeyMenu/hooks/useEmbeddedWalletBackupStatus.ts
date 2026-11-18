import { useQueryClient } from '@tanstack/react-query'
import { hasActiveNeckKey as checkHasActiveNeckKey, useEmbeddedWalletState } from '@universe/embedded-wallet'
import { useEvent } from 'utilities/src/react/hooks'
import { getPrivyAppId } from '~/config'
import { useIsEmbeddedWallet } from '~/connection/hooks/useIsEmbeddedWallet'
import {
  getListAuthenticatorsQueryOptions,
  useListAuthenticatorsQuery,
} from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'

export interface EmbeddedWalletBackupStatus {
  isEmbeddedWallet: boolean
  hasBackupLogin: boolean | undefined
  isLoading: boolean
}

/**
 * Fails closed: a skipped or not-yet-fetched query (e.g. right after switching wallets, before the new
 * NECK key is active) reports `isLoading: false` with no data, and must not read as "no backup login".
 */
export function getHasBackupLogin({
  isQueryEnabled,
  isLoading,
  isError,
  authData,
  hasPrivyAppId,
}: {
  isQueryEnabled: boolean
  isLoading: boolean
  isError: boolean
  authData: { recoveryMethods: readonly unknown[] } | undefined
  hasPrivyAppId: boolean
}): boolean | undefined {
  if (!isQueryEnabled || isLoading || isError || !authData) {
    return undefined
  }
  if (authData.recoveryMethods.length > 0) {
    return true
  }
  // Adding a backup login needs Privy
  return hasPrivyAppId ? false : undefined
}

export function useEmbeddedWalletBackupStatus({ skip = false }: { skip?: boolean } = {}): EmbeddedWalletBackupStatus {
  const isEmbeddedWallet = useIsEmbeddedWallet()
  const { walletId } = useEmbeddedWalletState()
  // listAuthenticators prompts for a passkey without an active NECK key
  const isQueryEnabled = !skip && isEmbeddedWallet && !!walletId && checkHasActiveNeckKey(walletId)
  const { data: authData, isLoading, isError } = useListAuthenticatorsQuery({ skip: !isQueryEnabled })

  return {
    isEmbeddedWallet,
    hasBackupLogin: getHasBackupLogin({
      isQueryEnabled,
      isLoading,
      isError,
      authData,
      hasPrivyAppId: !!getPrivyAppId(),
    }),
    isLoading: isQueryEnabled && isLoading,
  }
}

/** Prompts for a passkey if no NECK key is active. */
export function useCheckHasBackupLogin(): () => Promise<boolean | undefined> {
  const queryClient = useQueryClient()
  const { walletId } = useEmbeddedWalletState()

  return useEvent(async () => {
    if (!walletId) {
      return undefined
    }
    const authData = await queryClient.fetchQuery(getListAuthenticatorsQueryOptions(walletId))
    return getHasBackupLogin({
      isQueryEnabled: true,
      isLoading: false,
      isError: false,
      authData,
      hasPrivyAppId: !!getPrivyAppId(),
    })
  })
}
