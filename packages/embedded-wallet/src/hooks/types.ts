import type { UseMutationResult } from '@tanstack/react-query'
import type { EmbeddedWalletUnitagSource } from 'uniswap/src/features/telemetry/types'

// ── Post-login sequence ────────────────────────────────────────────────

export type CompleteEmbeddedWalletLoginInput = {
  walletAddress: string
  walletId: string
  exported?: boolean
  isCreate: boolean
  // Arm B of the onboarding experiment: how the created unitag was chosen. Undefined for arm A.
  unitagSource?: EmbeddedWalletUnitagSource
}

/**
 * App-provided reactions to the login sequence. The sequence itself (store persist,
 * wagmi connect, analytics, rotation check) lives in this package; anything that
 * touches app state (redux, drawer) is injected.
 */
export interface CompleteEmbeddedWalletLoginDeps {
  /** Maps a wagmi connector type to the app's analytics wallet-type label. */
  getAmplitudeWalletType: (connectorType?: string) => string
  /** Persist the "wallet is backed up" bit (web: user redux slice). */
  onBackupStateChanged: (isBackedUp: boolean) => void
  /** A v1 recovery method needs rotation (web: open the reconnect modal). */
  onNeedsRecoveryRotation: () => void
  /** Login sequence finished (web: account drawer open/close policy). */
  onLoginFinished: (input: { isCreate: boolean }) => void
}

// ── Sign in ────────────────────────────────────────────────────────────

export interface SignInWithPasskeyOptions {
  createNewWallet?: boolean
  unitag?: string
  unitagSource?: EmbeddedWalletUnitagSource
  onSuccess?: () => Promise<void> | void
  onError?: (error: Error) => void
}

export type SignInWithPasskeyResult = {
  walletAddress: string
  walletId: string
  exported?: boolean
  isRateLimited?: boolean
}

/**
 * App-provided reactions to the sign-in flow. The passkey ceremony, wallet
 * creation, and unitag claim live in this package; modal opening and analytics
 * labels are injected.
 */
export interface SignInWithPasskeyDeps {
  /** Runs the app's post-login sequence (see useOnCompleteEmbeddedWalletLogin). */
  completeLogin: (input: CompleteEmbeddedWalletLoginInput) => Promise<void>
  /** Unitag claim hit a rate limit (web: open the speedbump modal). */
  onRateLimited: (state: { walletAddress: string; walletId: string; exported?: boolean }) => void
  /** Device/browser cannot create passkeys (web: open the unsupported-browser modal). */
  onUnsupportedPasskeyCreation: () => void
  /** Connector labels for error logging on the sign-in path. */
  getConnectorMeta: () => { name: string; amplitudeType: string }
  /** Passkey ceremonies are blocked in iframes to prevent clickjacking. */
  isIFramed: () => boolean
}

export type SignInWithPasskeyHandle = Omit<
  UseMutationResult<SignInWithPasskeyResult, Error, void>,
  'mutate' | 'mutateAsync'
> & {
  signInWithPasskey: UseMutationResult<SignInWithPasskeyResult, Error, void>['mutate']
  signInWithPasskeyAsync: UseMutationResult<SignInWithPasskeyResult, Error, void>['mutateAsync']
}

// ── Sign out ───────────────────────────────────────────────────────────

export interface SignOutWithPasskeyOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * App-provided pieces of the sign-out flow. Privy SDKs stay app-owned
 * (web: useMaybePrivy), and cache invalidation is app state.
 */
export interface SignOutWithPasskeyDeps {
  /** Privy session logout, no-op when Privy is not configured. */
  privy: { logout: () => Promise<unknown>; ready: boolean }
  /** Whether the active wagmi wallet is the embedded wallet. */
  isEmbeddedWalletActive: boolean
  /** Post-signout cleanup (web: drop cached authenticators for this walletId). */
  onSignedOut: (walletId: string | null) => void
}

export type SignOutWithPasskeyHandle = Omit<UseMutationResult<boolean, Error, void>, 'mutate' | 'mutateAsync'> & {
  signOutWithPasskey: UseMutationResult<boolean, Error, void>['mutate']
}
