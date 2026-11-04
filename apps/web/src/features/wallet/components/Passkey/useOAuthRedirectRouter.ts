import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useMaybePrivy } from '~/features/wallet/hooks/useMaybePrivy'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { MenuStateVariant, useSetMenu } from '~/state/accountDrawer/menuState'
import { setOpenModal } from '~/state/application/reducer'

export const OAUTH_PENDING_KEY = 'addBackupLogin:oauthProvider'
export const RECOVER_OAUTH_PENDING_KEY = 'recoverWallet:oauthProvider'
export const RECONNECT_OAUTH_PENDING_KEY = 'reconnectBackupLogin:oauthProvider'

/**
 * Hook that detects an OAuth return (page reload after Privy redirect) and restores the UI:
 * opens the account drawer → PasskeyMenu → AddBackupLogin or RecoverWallet modal.
 *
 * Detection is based on sessionStorage keys set before the redirect — NOT URL params, because
 * Privy owns the `privy_oauth_*` params and removes them once its code exchange settles.
 *
 * This hook must NOT touch the `privy_oauth_*` query params. The headless code exchange runs in
 * an effect inside Privy's `useLoginWithOAuth` — mounted by the modal this hook opens, one render
 * later — and it reads those params from `window.location.search`. Removing them first starves
 * the exchange and the flow dies silently: Privy never authenticates, surfaces no error, and the
 * modal resets to its first step.
 *
 * Must be rendered in an always-mounted component (e.g. TopLevelModals).
 */
export function useOAuthRedirectRouter(): void {
  const dispatch = useDispatch()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()
  const { ready } = useMaybePrivy()

  useEffect(() => {
    if (!ready) {
      return
    }

    const addBackupPending = sessionStorage.getItem(OAUTH_PENDING_KEY)
    const recoverPending = sessionStorage.getItem(RECOVER_OAUTH_PENDING_KEY)
    const reconnectPending = sessionStorage.getItem(RECONNECT_OAUTH_PENDING_KEY)

    if (!addBackupPending && !recoverPending && !reconnectPending) {
      return
    }

    if (reconnectPending) {
      accountDrawer.open()
      setMenu({ variant: MenuStateVariant.PASSKEYS })
      dispatch(setOpenModal({ name: ModalName.ReconnectBackupLogin }))
    } else if (addBackupPending) {
      accountDrawer.open()
      setMenu({ variant: MenuStateVariant.PASSKEYS })
      dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
    } else if (recoverPending) {
      dispatch(setOpenModal({ name: ModalName.RecoverWallet }))
    }
  }, [dispatch, accountDrawer, setMenu, ready])
}
