import {
  DynamicConfigs,
  type RWAIssuerLogosMap,
  RWAIssuerLogosConfigKey,
  useDynamicConfigValue,
} from '@universe/gating'
import { useIsDarkMode } from 'ui/src'
import { isRWAIssuerLogosMap } from 'uniswap/src/features/gating/typeGuards'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'

const EMPTY_LOGOS: RWAIssuerLogosMap = {}

// Returns undefined when the issuer has no configured logo, so callers render no logo.
export function useRWAIssuerLogoUrl(issuer: RWAIssuer | undefined): string | undefined {
  const isDarkMode = useIsDarkMode()
  const logos = useDynamicConfigValue({
    config: DynamicConfigs.RWAIssuerLogos,
    key: RWAIssuerLogosConfigKey.Logos,
    defaultValue: EMPTY_LOGOS,
    customTypeGuard: isRWAIssuerLogosMap,
  })

  if (!issuer) {
    return undefined
  }

  const logo = logos[issuer]
  return (isDarkMode ? logo?.dark : logo?.light) ?? logo?.light ?? logo?.dark
}
