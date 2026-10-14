import { Bolt } from '@universe/mycelium/icons/Bolt'
import { Droplet } from '@universe/mycelium/icons/Droplet'
import { Settings } from '@universe/mycelium/icons/Settings'
import type { ComponentProps } from 'react'
import { colors } from 'ui/src/theme'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { usePoolsBrandGreen } from '~/hooks/usePoolsBrandGreen'

/** Raw accent shared by a method's glyph and explainer tile; undefined for methods drawn in neutral. */
export function useLaunchMethodAccentColor({ method }: { method: LaunchProvenanceMethod }): string | undefined {
  const poolsBrandGreen = usePoolsBrandGreen()
  switch (method) {
    case LaunchProvenanceMethod.CrowdLaunch:
      return poolsBrandGreen
    case LaunchProvenanceMethod.InstantLaunch:
      return colors.cyanBase
    default:
      return undefined
  }
}

/** Method glyphs do not imply a launchpad identity. */
export function LaunchMethodIcon({
  method,
  size,
}: {
  method: LaunchProvenanceMethod
  size: ComponentProps<typeof Settings>['size']
}): JSX.Element | null {
  const accentColor = useLaunchMethodAccentColor({ method })
  const iconByMethod: Record<LaunchProvenanceMethod, JSX.Element | null> = {
    [LaunchProvenanceMethod.CustomAuction]: <Settings size={size} color="$neutral1" />,
    [LaunchProvenanceMethod.CrowdLaunch]: <Droplet size={size} color={accentColor} />,
    [LaunchProvenanceMethod.InstantLaunch]: <Bolt size={size} color={accentColor} />,
    [LaunchProvenanceMethod.ThirdParty]: null,
    [LaunchProvenanceMethod.Unknown]: null,
  }

  return iconByMethod[method] ?? null
}
