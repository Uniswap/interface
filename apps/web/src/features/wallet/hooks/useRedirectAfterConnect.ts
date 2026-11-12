import { matchPath } from 'react-router'
import { create } from 'zustand'
import { isEmbedDocument } from '~/utils/isEmbedDocument'

// Pages that can fund a wallet in place (swap's Add funds nudge, the Buy form, the on-ramp return
// (ON_RAMP_RETURN_PATH) and TDP), plus passkey management, whose deep link signs in to manage that wallet.
// Anywhere else an unfunded wallet is better served by Portfolio.
const STAY_AFTER_CONNECT_PATTERNS = [
  '/swap',
  '/buy',
  '/onramp-return',
  '/explore/tokens/:chainName/:tokenAddress',
  '/manage/passkey/:walletAddress',
]

/** Whether a wallet that connects on `pathname` stays there even when unfunded. */
export function shouldStayAfterConnect(pathname: string, fallbackPath?: string): boolean {
  // A partner iframe keeps the user on the partner's surface.
  if (isEmbedDocument()) {
    return true
  }
  // A fallback means the page is sending the user away anyway (e.g. passkey management with the wrong wallet).
  if (fallbackPath) {
    return false
  }
  return STAY_AFTER_CONNECT_PATTERNS.some((pattern) => matchPath(pattern, pathname))
}

interface RedirectAfterConnectStore {
  /**
   * A connect waiting on its balance check. `pathname` is the page the connect started on; `fallbackPath` is where
   * a funded wallet goes, or stays put when unset. Only a balance fetched after `requestedAt` can decide it.
   */
  pending: { pathname: string; fallbackPath?: string; requestedAt: number } | undefined
  request: (fallbackPath?: string) => void
  clear: () => void
}

export const useRedirectAfterConnectStore = create<RedirectAfterConnectStore>((set) => ({
  pending: undefined,
  request: (fallbackPath) =>
    set((state) => {
      // A page's own fallback (Landing → /swap) wins over a bare connect request, whichever arrives first.
      const nextFallbackPath = fallbackPath ?? state.pending?.fallbackPath
      // Repeat requests keep the same object so the pending timeout doesn't restart.
      return state.pending?.fallbackPath === nextFallbackPath && state.pending
        ? state
        : {
            pending: {
              pathname: state.pending?.pathname ?? window.location.pathname,
              fallbackPath: nextFallbackPath,
              requestedAt: state.pending?.requestedAt ?? Date.now(),
            },
          }
    }),
  clear: () => set({ pending: undefined }),
}))

/**
 * Returns a function to call when a wallet connects: an unfunded wallet goes to Portfolio, anything else to
 * `fallbackPath` (or stays on the current page). Pages listed in `shouldStayAfterConnect` skip the Portfolio
 * redirect. `RedirectAfterConnect` resolves it.
 */
export function useRedirectAfterConnect(): (fallbackPath?: string) => void {
  return useRedirectAfterConnectStore((state) => state.request)
}
