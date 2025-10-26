import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { useAccount } from 'hooks/useAccount'
import { useDisconnect } from 'hooks/useDisconnect'
import { useModalState } from 'hooks/useModalState'
import { useSignInWithPasskey } from 'hooks/useSignInWithPasskey'
import Swap from 'pages/Swap'
import { useEffect, useMemo, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

type PasskeyManagementEffectDependencies = {
  account: {
    isConnecting: boolean
    address?: string
  }
  embeddedWalletAddress?: string | null
  dispatch: ReturnType<typeof useDispatch>
  signInWithPasskey: () => void
  accountDrawerHasBeenOpenedRef: React.MutableRefObject<boolean>
  passkeyConnectionAttemptedRef: React.MutableRefObject<boolean>
  navigate: ReturnType<typeof useNavigate>
  closeRecentlyConnectedModal: () => void
  accountDrawer: ReturnType<typeof useAccountDrawer>
  disconnect: () => void
  navigateToPasskeyManagement: () => void
}

/** @internal - Only exported for testing */
export function handleRouteToPasskeyManagement({
  account,
  embeddedWalletAddress,
  dispatch,
  signInWithPasskey,
  accountDrawerHasBeenOpenedRef,
  passkeyConnectionAttemptedRef,
  navigate,
  closeRecentlyConnectedModal,
  accountDrawer,
  disconnect,
  navigateToPasskeyManagement,
}: PasskeyManagementEffectDependencies) {
  // If the user is not connected and has not been prompted to sign in already, attempt passkey sign in
  function handleUserNotConnected() {
    closeRecentlyConnectedModal()
    accountDrawer.open()
    signInWithPasskey()
    passkeyConnectionAttemptedRef.current = true
    return
  }

  // If the user is connected and the address is not the embedded wallet address first disconnect the wallet
  // If the user has already been prompted to sign in, navigate to swap for non embedded wallet user
  function handleInvalidWalletAddress() {
    if (passkeyConnectionAttemptedRef.current) {
      navigate('/swap')
      return
    }
    dispatch(setIsTestnetModeEnabled(false))
    disconnect()
    return
  }

  // If the user is connected and the address is the embedded wallet address, navigate to passkey management
  function handleEmbeddedWalletConnected() {
    navigateToPasskeyManagement()
    return
  }

  return function handlePasskeyEffect() {
    // If the user actively connecting or no wallet address specified do nothing
    if (account.isConnecting || !embeddedWalletAddress) {
      return
    }

    if (!account.address && !passkeyConnectionAttemptedRef.current && !accountDrawerHasBeenOpenedRef.current) {
      handleUserNotConnected()
      return
    }

    if (account.address !== embeddedWalletAddress) {
      handleInvalidWalletAddress()
      return
    }

    if (!accountDrawerHasBeenOpenedRef.current) {
      handleEmbeddedWalletConnected()
      return
    }
  }
}

// A user should only reach this page from a deeplink to passkey management from the Uniswap Wallet
// This pages falls back to the swap page in the case that a user unintentionally navigates to this page or tries to connect a wallet other than the embedded wallet
export default function PasskeyManagement() {
  const account = useAccount()
  const { walletAddress: embeddedWalletAddress } = useParams()
  const disconnect = useDisconnect()
  const accountDrawer = useAccountDrawer()
  const dispatch = useDispatch()
  const setMenu = useSetMenu()
  const accountDrawerHasBeenOpenedRef = useRef<boolean>(accountDrawer.isOpen)
  const passkeyConnectionAttemptedRef = useRef<boolean>(false)
  const navigate = useNavigate()
  const { closeModal: closeRecentlyConnectedModal } = useModalState(ModalName.RecentlyConnectedModal)

  const navigateToPasskeyManagement = useEvent(() => {
    setTimeout(() => {
      setMenu({ variant: MenuStateVariant.PASSKEYS })
      accountDrawer.open()
      accountDrawerHasBeenOpenedRef.current = true
    }, 125)
  })
  const { signInWithPasskey } = useSignInWithPasskey({ onSuccess: navigateToPasskeyManagement })

  // raw disconnect is an unstable reference and causes an infinite loop
  const stableDisconnect = useEvent(() => disconnect())

  const handlePasskeyEffect = useMemo(
    () =>
      handleRouteToPasskeyManagement({
        account,
        embeddedWalletAddress,
        dispatch,
        signInWithPasskey,
        accountDrawerHasBeenOpenedRef,
        passkeyConnectionAttemptedRef,
        navigate,
        closeRecentlyConnectedModal,
        accountDrawer,
        disconnect: stableDisconnect,
        navigateToPasskeyManagement,
      }),
    [
      account,
      embeddedWalletAddress,
      dispatch,
      signInWithPasskey,
      navigate,
      closeRecentlyConnectedModal,
      accountDrawer,
      stableDisconnect,
      navigateToPasskeyManagement,
    ],
  )

  useEffect(() => {
    handlePasskeyEffect()
  }, [handlePasskeyEffect])

  return <Swap />
}
