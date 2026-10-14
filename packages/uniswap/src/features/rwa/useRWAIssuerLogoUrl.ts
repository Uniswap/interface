import {
  DynamicConfigs,
  type RWAIssuerLogosMap,
  RWAIssuerLogosConfigKey,
  useDynamicConfigValue,
  useIsTokenCategoriesEnabled,
} from '@universe/gating'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { isRWAIssuerLogosMap } from 'uniswap/src/features/gating/typeGuards'
import type { RWAIssuer } from 'uniswap/src/features/rwa/types'

const EMPTY_LOGOS: RWAIssuerLogosMap = {}

/**
 * Statsig-configured issuer logo; undefined when none is configured, so callers render no logo. With token
 * categories on, issuer branding is backend-served (`TokenIssuerInfo`) and the config is bypassed entirely.
 */
export function useRWAIssuerLogoUrl(issuer: RWAIssuer | undefined): string | undefined {
  const isDarkMode = useIsDarkMode()
  const isTokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const logos = useDynamicConfigValue({
    config: DynamicConfigs.RWAIssuerLogos,
    key: RWAIssuerLogosConfigKey.Logos,
    defaultValue: EMPTY_LOGOS,
    customTypeGuard: isRWAIssuerLogosMap,
  })

  if (!issuer || isTokenCategoriesEnabled) {
    return undefined
  }

  const logo = logos[issuer]
  return (isDarkMode ? logo?.dark : logo?.light) ?? logo?.light ?? logo?.dark
}
