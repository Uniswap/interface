import { hasActiveNeckKey as checkHasActiveNeckKey, useEmbeddedWalletState } from '@universe/embedded-wallet'
import { getPrivyAppId } from '~/config'
import { useIsEmbeddedWallet } from '~/connection/hooks/useIsEmbeddedWallet'
import { useListAuthenticatorsQuery } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'

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

export function useEmbeddedWalletBackupStatus(): EmbeddedWalletBackupStatus {
  const isEmbeddedWallet = useIsEmbeddedWallet()
  const { walletId } = useEmbeddedWalletState()
  // listAuthenticators prompts for a passkey without an active NECK key
  const isQueryEnabled = isEmbeddedWallet && !!walletId && checkHasActiveNeckKey(walletId)
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
