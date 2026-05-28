import { usePrivy } from '@privy-io/react-auth'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { MenuStateVariant, useSetMenu } from '~/components/AccountDrawer/menuState'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { setOpenModal } from '~/state/application/reducer'

export const OAUTH_PENDING_KEY = 'addBackupLogin:oauthProvider'
export const RECOVER_OAUTH_PENDING_KEY = 'recoverWallet:oauthProvider'

/**
 * Hook that detects an OAuth return (page reload after Privy redirect) and restores the UI:
 * opens the account drawer → PasskeyMenu → AddBackupLogin or RecoverWallet modal.
 *
 * Detection is based on sessionStorage keys set before the redirect — NOT URL params,
 * because PrivyProvider strips the OAuth query params during its own initialization
 * (before React effects run). The effect also waits for Privy `ready` so the code
 * exchange is complete before any modal that reads auth state is opened.
 *
 * Must be rendered in an always-mounted component (e.g. TopLevelModals).
 */
export function useOAuthRedirectRouter(): void {
  const dispatch = useDispatch()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()
  const { ready } = usePrivy()

  useEffect(() => {
    if (!ready) {
      return
    }

    const addBackupPending = sessionStorage.getItem(OAUTH_PENDING_KEY)
    const recoverPending = sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY)

    if (!addBackupPending && !recoverPending) {
      return
    }

    if (addBackupPending) {
      accountDrawer.open()
      setMenu({ variant: MenuStateVariant.PASSKEYS })
      dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
    } else if (recoverPending) {
      dispatch(setOpenModal({ name: ModalName.RecoverWallet }))
    }

    // Defensively clean up any leftover OAuth query params from URL.
    // PrivyProvider usually handles this, but strip them if still present.
    const url = new URL(window.location.href)
    url.searchParams.delete('privy_oauth_code')
    url.searchParams.delete('privy_oauth_state')
    url.searchParams.delete('privy_oauth_provider')
    if (url.toString() !== window.location.href) {
      window.history.replaceState({}, '', url.toString())
    }
  }, [dispatch, accountDrawer, setMenu, ready])
}
