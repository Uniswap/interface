const abortControllerRef: { current: AbortController | null } = { current: null }

export function startNavigatorCredentialRequest(reason: string): { abortSignal: AbortSignal } {
  // Cancel any pending requests.
  // This is needed because of a bug in how Chrome handles passkey requests inside the side panel.
  // Chrome bug: https://issues.chromium.org/issues/381056235
  // Video: https://github.com/Uniswap/universe/pull/21241
  abortControllerRef.current?.abort(reason)
  abortControllerRef.current = new AbortController()
  return { abortSignal: abortControllerRef.current.signal }
}
