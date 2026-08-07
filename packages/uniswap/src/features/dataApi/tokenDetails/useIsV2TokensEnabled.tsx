import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { createContext, useContext, type ReactNode } from 'react'

/**
 * Lets a subtree (e.g. the TDP) override the resolved value of FeatureFlags.V2EndpointsTokens
 * without changing the underlying gate. `undefined` means "no override" so every consumer outside
 * a provider — mobile, extension, non-TDP web — keeps reading the raw flag.
 */
const V2TokensEnabledOverrideContext = createContext<boolean | undefined>(undefined)

export function V2TokensEnabledOverrideProvider({
  value,
  children,
}: {
  value: boolean
  children: ReactNode
}): JSX.Element {
  return <V2TokensEnabledOverrideContext.Provider value={value}>{children}</V2TokensEnabledOverrideContext.Provider>
}

/**
 * Resolves FeatureFlags.V2EndpointsTokens, honoring a V2TokensEnabledOverrideProvider ancestor when
 * present. The TDP uses the override to fall back to the V2 endpoints on the Robinhood chain when
 * legacy data is incomplete (see useCreateTDPContext), so the whole page reads one coherent value.
 */
export function useIsV2TokensEnabled(): boolean {
  const override = useContext(V2TokensEnabledOverrideContext)
  const flagValue = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  return override ?? flagValue
}
