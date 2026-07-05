/**
 * HookSwap Terminal — `?ref=` referral capture.
 *
 * On app load we read the `?ref=<code>` query param from the URL and persist the
 * plain referral CODE (not its hash) to localStorage under `hookswap.referrer`.
 * This is first-touch attribution: once a referrer is stored it is NOT overwritten
 * by a later `?ref=` (a subsequent self-referral link can't clobber the original).
 *
 * FOLLOW-UP (out of scope here): wiring the stored referrer into swap execution —
 * i.e. hashing it with keccak256 and passing it as `refCode` to the referral
 * router's `swapExactInput` (or as a Universal Router hook param) — is a downstream
 * routing integration. This module only CAPTURES + STORES + EXPOSES the code.
 */
import { useEffect } from 'react'
import { useSearchParams } from 'react-router'

/** localStorage key holding the captured referral code (plain string). */
export const REFERRER_STORAGE_KEY = 'hookswap.referrer'

/** Read the stored referrer code, or undefined if none / unavailable. */
export function getStoredReferrer(): string | undefined {
  try {
    const value = window.localStorage.getItem(REFERRER_STORAGE_KEY)
    return value && value.length > 0 ? value : undefined
  } catch {
    // localStorage can throw (private mode / disabled storage) — treat as "none".
    return undefined
  }
}

/** Persist a referrer code (first-touch: never overwrites an existing one). */
function storeReferrer(code: string): void {
  try {
    if (getStoredReferrer() !== undefined) {
      return
    }
    window.localStorage.setItem(REFERRER_STORAGE_KEY, code)
  } catch {
    // Ignore storage failures — capture is best-effort, never blocks the app.
  }
}

/**
 * App-wide capture effect. Mount ONCE high in the tree (Terminal chrome). Reads
 * `?ref=` on every navigation and stores the first non-empty code it sees.
 */
export function useCaptureRef(): void {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim()
    if (ref) {
      storeReferrer(ref)
    }
  }, [searchParams])
}
