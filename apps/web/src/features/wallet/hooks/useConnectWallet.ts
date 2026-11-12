import { useUpdateAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { useEvent } from 'utilities/src/react/hooks'
import {
  createUniswapEmbeddedConnectionService,
  createUniswapMobileConnectionService,
} from '~/connection/connectors/custom'
import { useConnectWallet as useConnectWalletService } from '~/connection/hooks/useConnectWallet'
import type { ConnectionService } from '~/connection/services/IConnectionService'
import { useRedirectAfterConnect } from '~/features/wallet/hooks/useRedirectAfterConnect'
import { useSignInWithPasskey } from '~/features/wallet/hooks/useSignInWithPasskey'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { persistHideMobileAppPromoBannerAtom } from '~/state/application/atoms'

/**
 * Connects a wallet with the app wiring the connection plumbing can't own: closing the account drawer as each
 * platform connects, the passkey sign-in flow for the embedded wallet, hiding the mobile promo banner once
 * Uniswap Mobile connects, and sending an unfunded wallet to Portfolio.
 */
export function useConnectWallet() {
  const accountDrawer = useAccountDrawer()
  const { signInWithPasskeyAsync } = useSignInWithPasskey()
  const setPersistHideMobileAppPromoBanner = useUpdateAtom(persistHideMobileAppPromoBannerAtom)
  const redirectAfterConnect = useRedirectAfterConnect()

  const serviceOverrides = useMemo((): Partial<Record<string, ConnectionService>> => {
    const uniswapMobileService = createUniswapMobileConnectionService()
    return {
      [CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID]: createUniswapEmbeddedConnectionService({
        signIn: signInWithPasskeyAsync,
      }),
      [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: {
        connect: async (params) => {
          setPersistHideMobileAppPromoBanner(true)
          return uniswapMobileService.connect(params)
        },
      },
    }
  }, [signInWithPasskeyAsync, setPersistHideMobileAppPromoBanner])

  const { connectWallet, ...rest } = useConnectWalletService({
    serviceOverrides,
    onCompletedPlatform: accountDrawer.close,
  })

  const connectWalletAndRedirect = useEvent((params: Parameters<typeof connectWallet>[0]) =>
    connectWallet({
      ...params,
      onSuccess: () => {
        params.onSuccess?.()
        redirectAfterConnect()
      },
    }),
  )

  return { connectWallet: connectWalletAndRedirect, ...rest }
}
