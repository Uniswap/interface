import { create } from 'zustand'

/**
 * Keys of the Blast shutdown prompts dismissed this session. In memory only, so every app launch or page load warns
 * again, but it outlives the remounts that local state doesn't: tab switches, navigation resets, the landing page.
 */
export const useBlastShutdownDismissals = create<{ dismissed: ReadonlySet<string> }>()(() => ({ dismissed: new Set() }))

export function dismissBlastShutdown(key: string): void {
  useBlastShutdownDismissals.setState(({ dismissed }) => ({ dismissed: new Set(dismissed).add(key) }))
}
