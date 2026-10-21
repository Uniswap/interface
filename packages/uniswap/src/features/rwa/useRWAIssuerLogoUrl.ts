import {
  DynamicConfigs,
  type RWAIssuerLogosMap,
  RWAIssuerLogosConfigKey,
  useDynamicConfigValue,
  useIsTokenCategoriesEnabled,
} from '@universe/gating'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { isRWAIssuerLogosMap } from 'uniswap/src/features/gating/typeGuards'
import type { RWAIssuer, RWAIssuerDisplay, RWAIssuerLogos, RWAThemedLogoUrls } from 'uniswap/src/features/rwa/types'

const EMPTY_LOGOS: RWAIssuerLogosMap = {}

function pickThemedUrl(urls: RWAThemedLogoUrls | undefined, isDarkMode: boolean): string | undefined {
  return (isDarkMode ? urls?.dark : urls?.light) ?? urls?.light ?? urls?.dark
}

/**
 * Statsig-configured issuer logo; undefined when none is configured, so callers render no logo. With token
 * categories on, issuer branding is backend-served (`TokenIssuerInfo`) and the config is bypassed entirely.
 */
function useRWAIssuerLogoUrl(issuer: RWAIssuer | undefined): string | undefined {
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

  return pickThemedUrl(logos[issuer], isDarkMode)
}

/**
 * The issuer logo to render: the backend's themed set for `variant` when served, else its untyped `logoUrl`
 * (color, light-theme), else the Statsig config. Backend branding wins because commodity issuer ids are
 * CoinGecko slugs with no config entry.
 */
export function useRWAIssuerLogo({
  issuer,
  variant,
}: {
  issuer: RWAIssuerDisplay | undefined
  variant: keyof RWAIssuerLogos
}): string | undefined {
  const isDarkMode = useIsDarkMode()
  const configLogoUrl = useRWAIssuerLogoUrl(issuer?.issuer)
  return pickThemedUrl(issuer?.issuerLogos?.[variant], isDarkMode) ?? issuer?.issuerLogoUrl ?? configLogoUrl
}
