import { PoolsLogo } from '@universe/mycelium/icons/PoolsLogo'
import { useTranslation } from 'react-i18next'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'

/**
 * Brand name, deliberately not translated. The tooltip string interpolates it, so every locale
 * follows this one constant.
 */
const POOLS_BRAND_NAME = 'pools.xyz'

/**
 * QuickLaunch: the pools.xyz droplet mark appended to a quick-launch auction's token name in
 * discovery — logo only, no label, sized to mirror the verified CheckmarkCircle it sits beside
 * ($icon.16), with the brand attribution carried by the hover tooltip. Renders the local PoolsLogo
 * asset in the shared Pools brand green, not the hero wordmark's darker light-mode green or
 * the registry-served launchpad logo.
 *
 * Callers keep the existing gating: the `quick_launch` feature flag, the backend `is_quick_launch`
 * classification (see quickLaunchClassification.ts), AND Robinhood Chain only — pools.xyz serves
 * Robinhood launches exclusively, so the attribution would be false provenance elsewhere. COSMETIC
 * ONLY — the classifier is forgeable, so this must never gate protection signals.
 */
export function PoolsTradeBadge(): JSX.Element {
  const { t } = useTranslation()
  const poolsBrandGreen = usePoolsBrandGreen()

  return (
    <MouseoverTooltip
      placement="top"
      size={TooltipSize.Small}
      text={t('toucan.poolsTradeBadge.tooltip', { launchpad: POOLS_BRAND_NAME })}
    >
      <PoolsLogo size="$icon.16" color={poolsBrandGreen} />
    </MouseoverTooltip>
  )
}
