import { create } from 'zustand'

interface EmbeddedWalletLoginViewStore {
  showLoginView: boolean
  // Drives a loading state when passkey sign-in is triggered externally (e.g. RecentlyConnectedModal)
  passkeySignInPending: boolean
  setShowLoginView: (showLoginView: boolean) => void
  setPasskeySignInPending: (passkeySignInPending: boolean) => void
}

export const useEmbeddedWalletLoginViewStore = create<EmbeddedWalletLoginViewStore>((set) => ({
  showLoginView: false,
  passkeySignInPending: false,
  setShowLoginView: (showLoginView) => set({ showLoginView }),
  setPasskeySignInPending: (passkeySignInPending) => set({ passkeySignInPending }),
}))
