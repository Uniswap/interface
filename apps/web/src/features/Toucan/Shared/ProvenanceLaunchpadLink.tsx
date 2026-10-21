import { Anchor, Flex, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { type LaunchProvenance, LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import type { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import type { TokenProvenanceAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { sanitizeUrl } from 'utilities/src/format/urls'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'
import { ExploreTab } from '~/types/explore'

/** Explore's auctions tab, which lists Uniswap's own custom auctions. */
const CUSTOM_AUCTIONS_PATH = `/explore/${ExploreTab.Toucan}`

export interface LaunchpadDestination {
  /** Where the launchpad leads; undefined renders its affordance as a static label. */
  href: string | undefined
  isExternal: boolean
}

/**
 * A launchpad affordance identifies the launchpad, so it leads to that launchpad's own listing —
 * never to a single launch, which the provenance module's details link already covers. Uniswap's own
 * custom auctions have no external site; their listing is Explore's auctions tab. Crowd launches are
 * a pools.xyz launchpad and keep their own site, and a third-party frontend running either mechanism
 * is a different launchpad again, so neither is sent to ours.
 */
export function getLaunchpadDestination({ provenance }: { provenance: LaunchProvenance }): LaunchpadDestination {
  if (
    provenance.launchpad.id === UNISWAP_CCA_LAUNCHPAD_ID &&
    provenance.method === LaunchProvenanceMethod.CustomAuction
  ) {
    return { href: CUSTOM_AUCTIONS_PATH, isExternal: false }
  }
  // The launchpad url will be backend-supplied; only http(s) may become an href so a served `javascript:`/`data:` scheme cannot run.
  return {
    href: sanitizeUrl({
      url: provenance.launchpad.url,
      allowedProtocols: ['http:', 'https:'],
      callerName: 'getLaunchpadDestination',
    }),
    isExternal: true,
  }
}

function TracedLaunchpadLink({
  href,
  isExternal,
  element,
  launchMethod,
  onPress,
  children,
}: {
  href: string
  isExternal: boolean
  element: ElementName
  launchMethod: NonNullable<TokenProvenanceAnalyticsProperties['launch_method']>
  onPress?: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <Trace logPress element={element} properties={{ launch_method: launchMethod }}>
      {isExternal ? (
        <Anchor href={href} target="_blank" rel="noopener noreferrer" textDecorationLine="none">
          {children}
        </Anchor>
      ) : (
        <Link to={href} style={{ textDecoration: 'none' }} onClick={onPress}>
          {children}
        </Link>
      )}
    </Trace>
  )
}

/**
 * The launchpad affordance shared by the TDP header chip and the provenance module: one tooltip, and
 * one destination reachable both from the affordance itself and from the tooltip's second line, so
 * the line that names the destination is the line that opens it.
 */
export function ProvenanceLaunchpadLink({
  launchpad,
  href,
  isExternal,
  element,
  launchMethod,
  onPress,
  children,
}: {
  launchpad: LaunchProvenance['launchpad']
  element: ElementName
  launchMethod: NonNullable<TokenProvenanceAnalyticsProperties['launch_method']>
  /** Reports the in-app launches navigation; an external destination is covered by `Trace` alone. */
  onPress?: () => void
  children: ReactNode
} & LaunchpadDestination): JSX.Element {
  const { t } = useTranslation()

  if (!href) {
    return <>{children}</>
  }

  const link = (content: ReactNode): JSX.Element => (
    <TracedLaunchpadLink
      href={href}
      isExternal={isExternal}
      element={element}
      launchMethod={launchMethod}
      onPress={onPress}
    >
      {content}
    </TracedLaunchpadLink>
  )

  return (
    <MouseoverTooltip
      placement="top"
      size={TooltipSize.Small}
      fitContent
      text={
        <Flex gap="$spacing4">
          <Text variant="body4" color="$neutral1">
            {t('tdp.header.launchpad.launchedOn', { launchpad: launchpad.name })}
          </Text>
          {link(
            <Text variant="buttonLabel4" color="$neutral2" hoverStyle={{ color: '$neutral2Hovered' }}>
              {t('tdp.header.launchpad.viewAll', { launchpad: launchpad.name })}
            </Text>,
          )}
        </Flex>
      }
    >
      {link(children)}
    </MouseoverTooltip>
  )
}
