import type { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import type { TestIDType } from '@universe/test'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
import { gap } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import {
  getHeaderLogoSize,
  getHeaderTitleLineHeight,
  getHeaderTitleVariant,
} from '~/components/StickyCollapsibleHeader/getHeaderLogoSize'
import { LoadingBubble } from '~/components/Tokens/loading'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

// flexShrink 0 is load-bearing: this is a plain `<a>`, so it defaults to CSS flex-shrink 1, and the
// explicit minWidth 0 also removes its automatic min-content floor. Without it the link absorbs the
// whole overflow deficit of a wide header row — the logo link collapses to ~0 while the 48px logo
// keeps painting over the title next to it.
const LOGO_LINK_STYLE = {
  textDecoration: 'none',
  display: 'flex',
  minWidth: 0,
  flexShrink: 0,
} as const

// Wraps the name and ticker only — the adornments sit outside it, so tapping a badge can't navigate.
// As a flex item of the title row it must shrink and drop its min-content floor: the adornments are
// unshrinkable, so the link is what yields and the name ellipsizes instead of a badge being pushed
// past the header edge. gap/alignItems reproduce the title row's own spacing for the texts inside.
const TITLE_LINK_STYLE = {
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'flex-end',
  gap: gap.gap8,
  minWidth: 0,
  flexShrink: 1,
} as const

interface DetailsHeaderTitleProps {
  /** Display name, rendered as the h1. */
  name: string | undefined
  /** Ticker, rendered inline after the name on desktop and via `mobileSubtitle` on mobile web. */
  symbol: string
  isCompact: boolean
  /** Shows a title-sized skeleton in place of the name, ticker and mobile subtitle while the identity resolves. */
  isLoading?: boolean
  logoUrl?: string | null
  /** Logo seed name — may differ from the displayed name (e.g. RWAs show the underlying asset name). */
  logoName?: string | null
  logoSymbol?: string
  chainId?: UniverseChainId | null
  /**
   * Restricts the logo's chain badge to the widths where `metadataRow` is actually rendered and names
   * the network itself — mobile web, where the row drops its network entry, and any state in which the
   * caller withholds the row entirely, keep the badge. Off by default because TDP names the network in
   * its metadata row at every width and shows the badge alongside it; surfaces whose row drops the
   * network entry at $sm opt in, so the network is named exactly once. Opting in makes naming the
   * network the caller's responsibility: it must pass a `metadataRow` that does so at every width it
   * leaves the badge off.
   */
  showLogoNetworkBadgeOnMobileOnly?: boolean
  /** Links the logo and the name/ticker to this route. Adornments stay outside the link. */
  titleHref?: string
  /** Floor for the name's width, for surfaces whose name can legitimately be empty. */
  titleMinWidth?: number
  /** Icons/badges rendered inline after the ticker. */
  titleAdornments?: ReactNode
  /** Second line shown on mobile web, where the inline ticker is hidden. */
  mobileSubtitle?: ReactNode
  /** Metadata under the title (network, address, chips). Hidden on mobile web unless `showMetadataRowOnMobile`. */
  metadataRow?: ReactNode
  /**
   * Keeps `metadataRow` visible on mobile web. Off by default because TDP substitutes its row there
   * (address copy moves inline, network shows as a logo badge); surfaces without a substitute opt in
   * so the row's content isn't dropped on mweb.
   */
  showMetadataRowOnMobile?: boolean
  /**
   * Lets the name column shrink below its content width. Stacks default to flexShrink 0, so a surface
   * whose `metadataRow` is a horizontal scroller has to opt in: otherwise the column is floored at the
   * scroller's max-content width and overflows the header instead of the scroller carrying the overflow.
   */
  shrinkTitleColumn?: boolean
  /** Right-hand cluster (share/report actions, network filter). */
  actions?: ReactNode
  dataTestId?: TestIDType
  /** Extra nodes (e.g. modals) rendered inside the header container. */
  children?: ReactNode
}

/**
 * True at the widths where `DetailsHeaderTitle` withholds its metadata row **from a caller that
 * leaves `showMetadataRowOnMobile` off**. A caller that renders a substitute for what that row
 * carries — TDP's compact network filter — must gate on this instead of duplicating `!media.sm`
 * inline: an independent computation can drift from this gate if either changes, double-mounting
 * the substitute beside the row or dropping it in the gap.
 *
 * Only an exact complement of the row's own gate (`!media.sm || showMetadataRowOnMobile`) while that
 * flag is off, which is why TDP — the sole caller needing a substitute — can use it as one. A caller
 * that opts in keeps its row at every width and so has nothing to substitute; the auction does opt
 * in, and correspondingly does not call this.
 */
export function useMetadataRowHidden(): boolean {
  return useMedia().sm
}

/**
 * Shared title block for the sticky collapsible details headers (token details, auction): logo,
 * name + ticker, mobile subtitle, and a nested metadata row. Callers supply their own content
 * through the slots so the layout stays identical across pages.
 */
export function DetailsHeaderTitle({
  name,
  symbol,
  isCompact,
  isLoading = false,
  logoUrl,
  logoName,
  logoSymbol,
  chainId,
  showLogoNetworkBadgeOnMobileOnly = false,
  titleHref,
  titleMinWidth,
  titleAdornments,
  mobileSubtitle,
  metadataRow,
  showMetadataRowOnMobile = false,
  shrinkTitleColumn = false,
  actions,
  dataTestId,
  children,
}: DetailsHeaderTitleProps): JSX.Element {
  const media = useMedia()
  const logoSize = getHeaderLogoSize({ isCompact, media, scaleMobileOnScroll: true })
  // Above $sm the metadata row is the thing that names the network — but only while it is actually
  // rendered. Opting in is a promise about that row, so whenever a caller withholds it the badge has
  // to come back or the network is named nowhere.
  const networkNamedByMetadataRow = !media.sm && Boolean(metadataRow)

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%" testID={dataTestId}>
      <Flex row flex={1} alignItems="center" gap="$gap12">
        <TitleLink href={titleHref} style={LOGO_LINK_STYLE} decorative>
          <TokenLogo
            url={logoUrl}
            symbol={logoSymbol}
            name={logoName}
            chainId={chainId}
            // Hides the badge rather than dropping chainId: chainId also drives the testnet ring,
            // which has to stay at every width.
            hideNetworkLogo={showLogoNetworkBadgeOnMobileOnly && networkNamedByMetadataRow}
            size={logoSize}
            transition={HEADER_TRANSITION}
          />
        </TitleLink>
        <Flex
          gap={isCompact ? '$gap4' : '$gap8'}
          $md={{ gap: '$none' }}
          {...(shrinkTitleColumn ? { shrink: true } : {})}
          transition={HEADER_TRANSITION}
        >
          <Flex row flex={1} alignItems="flex-end" gap="$gap8" $sm={{ width: '100%' }}>
            {isLoading ? (
              <LoadingBubble
                height={getHeaderTitleLineHeight({ isCompact, media })}
                width={136}
                containerProps={{ width: 'max-content' }}
              />
            ) : (
              <TitleLink href={titleHref} style={TITLE_LINK_STYLE}>
                <Text
                  tag="h1"
                  variant={getHeaderTitleVariant({ isCompact, media })}
                  // Adornments are unshrinkable pills, so the name is what yields when the title line runs
                  // out of room: it ellipsizes (see EllipsisTamaguiStyle) instead of pushing the last
                  // adornment past the header edge. Shrinking needs a non-auto min-width, since a nowrap
                  // text's min-content is its full width.
                  flexShrink={1}
                  minWidth={titleMinWidth ?? 0}
                  transition={HEADER_TRANSITION}
                  {...EllipsisTamaguiStyle}
                >
                  {name}
                </Text>
                {!isCompact && !media.md && (
                  <Text
                    tag="h2"
                    variant="subheading1"
                    textTransform="uppercase"
                    color="$neutral2"
                    $sm={{ display: 'none' }}
                    transition={HEADER_TRANSITION}
                  >
                    {symbol}
                  </Text>
                )}
              </TitleLink>
            )}
            {/* Outside TitleLink on purpose: badges carry their own tooltips/taps, which a wrapping
                anchor would swallow into a navigation. */}
            {titleAdornments}
          </Flex>
          {!isLoading && mobileSubtitle}
          {(!media.sm || showMetadataRowOnMobile) && metadataRow}
        </Flex>
      </Flex>
      {actions ? (
        <Flex row gap="$gap8" alignItems="center" justifyContent="center">
          {actions}
        </Flex>
      ) : null}
      {children}
    </Flex>
  )
}

// Renders no wrapper when there is no href, so headers without a linked title keep their DOM unchanged.
// The logo link is marked decorative to avoid a duplicate tab stop / announcement for the same route.
function TitleLink({
  href,
  style,
  decorative,
  children,
}: {
  href?: string
  style: CSSProperties
  decorative?: boolean
  children: ReactNode
}): JSX.Element {
  if (!href) {
    return <>{children}</>
  }

  return (
    <Link to={href} style={style} aria-hidden={decorative} tabIndex={decorative ? -1 : undefined}>
      {children}
    </Link>
  )
}
