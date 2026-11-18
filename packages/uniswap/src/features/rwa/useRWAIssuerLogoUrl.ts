import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import type { RWAIssuerDisplay, RWAIssuerLogos, RWAThemedLogoUrls } from 'uniswap/src/features/rwa/types'

function pickThemedUrl(urls: RWAThemedLogoUrls | undefined, isDarkMode: boolean): string | undefined {
  return (isDarkMode ? urls?.dark : urls?.light) ?? urls?.light ?? urls?.dark
}

/**
 * The issuer logo to render: the backend's themed set for `variant` when served, else its untyped `logoUrl`
 * (color, light-theme). Undefined when the backend serves neither, so callers render no logo.
 */
export function useRWAIssuerLogo({
  issuer,
  variant,
}: {
  issuer: RWAIssuerDisplay | undefined
  variant: keyof RWAIssuerLogos
}): string | undefined {
  const isDarkMode = useIsDarkMode()
  return pickThemedUrl(issuer?.issuerLogos?.[variant], isDarkMode) ?? issuer?.issuerLogoUrl
}
