import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Anchor, Flex, IconButton, iconSizes, Text } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { PoolsLogo } from '@universe/mycelium/icons/PoolsLogo'
import { useIsDarkMode, useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { type FocusEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { gap } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { DeltaArrow, getDeltaTextColor } from '~/components/DeltaArrow/DeltaArrow'
import { usePoolsWordmarkGreen } from '~/hooks/usePoolsBrandGreen'
import { POOLS_URL } from '~/pages/Launches/constants'
import { LaunchesHeroNetworkLockup } from '~/pages/Launches/LaunchesHeroNetworkLockup'
import { LaunchItem } from '~/pages/Launches/launchesModel'

const HERO_PADDING = 24
const HERO_PADDING_MD = 16
const QUICK_LAUNCH_PILL_LOGO_SIZE = 24
/**
 * Widest a pill's name may render. Token names are user-supplied and unbounded, and the strip below is
 * sized to its content, so one long name would stretch the strip without adding any time to the
 * animation — speeding the scroll up for every pill. `numberOfLines` can't bound it alone: it sets the
 * ellipsis, but the width it resolves against defaults to `100%` of a parent that is itself content-
 * sized. 180px clears a typical name several times over and keeps the widest pill inside the range the
 * feed already produces.
 */
const QUICK_LAUNCH_PILL_NAME_MAX_WIDTH = 180
// Inline-block baselines sit on the text baseline; drop the logo so its mass centers on the x-height.
const POOLS_LOGO_BASELINE_NUDGE = '-0.2em'

/**
 * Most pills the strip renders. The request deliberately keeps the Trending tab's page size, so the
 * feed can serve far more rows than a marquee reads at a glance; this caps what gets rendered.
 */
const QUICK_LAUNCH_MARQUEE_MAX_PILLS = 20
// Marquee pace: 0.7 × the ~76 px/s the old count-derived duration (3s per pill) measured at the cap.
const QUICK_LAUNCH_SCROLL_PX_PER_SECOND = 53

// The strip is rendered twice, so animating 0 -> -50% scrolls the pills right-to-left in a seamless
// loop; the duration is set inline from the measured width. Hover pauses it. Keyboard focus and
// reduced motion swap in a static, scrollable strip: a paused transform would leave focused pills
// clipped off the left edge, where the browser can't scroll them into view. Keyed on :focus-visible,
// not :focus-within — a mouse click also focuses the pill, and snapping the strip mid-click retargets
// the click and then leaves it frozen while the new tab holds focus. While animating, only the pills
// take the pointer so gap clicks fall through to the card's link; the static strip takes it back so it
// can be wheel-scrolled anywhere. The keyboard state hides its scrollbar (keys drive it); reduced
// motion keeps one.
const quickLaunchMarqueeCss = `
  @keyframes launches-quick-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .launches-quick-marquee { overflow: hidden; pointer-events: none; }
  .launches-quick-strip { animation: launches-quick-scroll linear infinite; }
  .launches-quick-marquee:hover .launches-quick-strip { animation-play-state: paused; }
  .launches-quick-marquee:has(:focus-visible) { overflow-x: auto; pointer-events: auto; scrollbar-width: none; }
  .launches-quick-marquee:has(:focus-visible)::-webkit-scrollbar { display: none; }
  .launches-quick-marquee:has(:focus-visible) .launches-quick-strip { animation: none; }
  @media (prefers-reduced-motion: reduce) {
    .launches-quick-marquee { overflow-x: auto; pointer-events: auto; }
    .launches-quick-strip { animation: none; }
  }
`

function openPoolsInNewTab(): void {
  window.open(POOLS_URL, '_blank', 'noopener,noreferrer')
}

// Keyboard focus only: not every browser scrolls a newly focused element into view inside an
// overflow-x container, while a click-focused pill must leave the moving strip alone.
function scrollPillIntoView(event: FocusEvent<HTMLElement>): void {
  if (event.currentTarget.matches(':focus-visible')) {
    event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
}

/**
 * Rounded pill for one quick launch — token logo, name, and 24h delta (arrow + percent) — linking to
 * the token's Pools page. Its visible name is its accessible name. Loop clones leave the tab order;
 * the strip hides them from assistive tech.
 */
function QuickLaunchPill({ launch, isClone }: { launch: LaunchItem; isClone: boolean }): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const delta = launch.priceChangePercent24h

  return (
    <Trace
      logPress
      element={ElementName.LaunchesHeroPill}
      properties={{ chain_id: launch.logoChainId, token_address: launch.tokenAddress }}
    >
      <Anchor
        href={launch.poolsTokenUrl ?? POOLS_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={isClone ? -1 : undefined}
        onFocus={scrollPillIntoView}
        textDecorationLine="none"
        display="flex"
        flexDirection="row"
        alignItems="center"
        gap="$spacing8"
        py="$spacing8"
        px="$spacing12"
        mr="$spacing8"
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface2"
        hoverStyle={{ backgroundColor: '$surface2Hovered' }}
        // Sits above the card's stretched link and re-enables the hit-testing the moving strip turns off.
        position="relative"
        zIndex={1}
        $platform-web={{ pointerEvents: 'auto' }}
      >
        <TokenLogo
          chainId={launch.logoChainId}
          size={QUICK_LAUNCH_PILL_LOGO_SIZE}
          symbol={launch.symbol}
          name={launch.name}
          url={launch.logoUrl}
        />
        <Text variant="body3" color="$neutral1" numberOfLines={1} maxWidth={QUICK_LAUNCH_PILL_NAME_MAX_WIDTH}>
          {launch.name}
        </Text>
        {delta !== undefined && (
          <Flex row alignItems="center" gap="$gap4">
            <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} size={iconSizes.icon16} />
            <Text variant="body3" color={getDeltaTextColor(delta)}>
              {formatPercent(Math.abs(delta))}
            </Text>
          </Flex>
        )}
      </Anchor>
    </Trace>
  )
}

/** Auto-scrolling, edge-faded marquee of quick-launch pills that bleeds to the hero card's edges. */
function QuickLaunchMarquee({ launches }: { launches: LaunchItem[] }): JSX.Element {
  const colors = useSporeColors()

  // One pill per distinct token, capped; the strip is duplicated below purely for the seamless loop.
  const strip = useMemo(() => {
    const byId = new Map(launches.map((launch) => [launch.id, launch]))
    return Array.from(byId.values()).slice(0, QUICK_LAUNCH_MARQUEE_MAX_PILLS)
  }, [launches])

  // Travel per loop is one copy of the strip (half the doubled row), so measuring it is what holds
  // the pace exact whatever the pill count or name lengths come out to.
  const [stripEl, setStripEl] = useState<HTMLElement | null>(null)
  const [travelPx, setTravelPx] = useState(0)
  useEffect(() => {
    if (!stripEl) {
      return undefined
    }
    const measure = (): void => setTravelPx(stripEl.offsetWidth / 2)
    measure()
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(stripEl)
    return () => resizeObserver.disconnect()
  }, [stripEl])
  const scrollDurationSeconds = travelPx / QUICK_LAUNCH_SCROLL_PX_PER_SECOND

  return (
    <Flex
      alignSelf="stretch"
      mt="$spacing16"
      mx={-HERO_PADDING}
      $md={{ mx: -HERO_PADDING_MD }}
      // Phone widths: tighten the header-to-carousel gap by 8px so the card reads as one unit.
      $sm={{ mt: '$spacing8' }}
      position="relative"
      // Transparent to the pointer so gap clicks reach the card's link; the scroller opts back in.
      pointerEvents="none"
    >
      <style>{quickLaunchMarqueeCss}</style>
      {/* The scroller is its own box so the edge fade below stays pinned when it scrolls. */}
      <Flex className="launches-quick-marquee">
        {/* `maxContent` is load-bearing, not cosmetic. The parent is a column flex container, so the
            horizontal axis is its cross axis: left to stretch, the strip takes the card's width and the
            keyframe's -50% resolves against the card rather than the pills — the row then travels half
            a card, and only the handful of tokens that fit in it ever scroll into view. */}
        <Flex
          ref={setStripEl}
          row
          maxContent
          className={travelPx > 0 ? 'launches-quick-strip' : undefined}
          style={travelPx > 0 ? { animationDuration: `${scrollDurationSeconds}s` } : undefined}
        >
          {strip.map((launch) => (
            <QuickLaunchPill key={`quick-a-${launch.id}`} launch={launch} isClone={false} />
          ))}
          {/* Loop clone: presentation only, so screen readers hear each token once. */}
          <Flex row aria-hidden>
            {strip.map((launch) => (
              <QuickLaunchPill key={`quick-b-${launch.id}`} launch={launch} isClone />
            ))}
          </Flex>
        </Flex>
      </Flex>
      <Flex
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        pointerEvents="none"
        zIndex={1}
        $platform-web={{
          background: `linear-gradient(90deg, ${colors.surface1.val} 0%, transparent 8%, transparent 92%, ${colors.surface1.val} 100%)`,
        }}
      />
    </Flex>
  )
}

/**
 * The Pools lockup as a single inline "word" for `<Trans>` to drop into the subtitle sentence:
 * logo + wordmark, unbreakable, everything else (font, size, wrapping) inherited from the
 * surrounding `<Text>` so the sentence rags as one continuous run.
 */
function PoolsWordmark({ children }: { children?: ReactNode }): JSX.Element {
  const poolsBrandGreen = usePoolsWordmarkGreen()

  return (
    <span style={{ color: poolsBrandGreen, whiteSpace: 'nowrap' }}>
      {/* Tailwind preflight sets `display: block` on every svg, which would drop the logo out of
          the text run — the inline-block wrapper restores inline flow and carries the baseline nudge. */}
      <span
        style={{ display: 'inline-block', verticalAlign: POOLS_LOGO_BASELINE_NUDGE, marginRight: gap.gap4 }}
        aria-hidden
      >
        <PoolsLogo size="$icon.16" color={poolsBrandGreen} />
      </span>
      {children}
    </span>
  )
}

/**
 * Promo hero linking out to pools.xyz: network lockup + "Launch and trade" heading, a "Trade new …
 * tokens on Pools" subtitle, and a trailing round arrow (desktop and tablet only). When there are
 * Pools launches, a looping marquee of their pills scrolls along the foot of the card. A stretched
 * link makes the whole card open pools.xyz, except the pills, which open their token's Pools page.
 * Arc joins the lockup and the copy once its rollout flag is on.
 */
export function LaunchesHero({ launches }: { launches: LaunchItem[] }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isArcEnabled = useFeatureFlag(FeatureFlags.Arc)
  const isDarkMode = useIsDarkMode()
  const dotColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  // Inset ring: the link fills the card's padding box, so an outline drawn outside it would be clipped.
  const cardLinkFocusCss = `
    .launches-hero-card-link:focus-visible { outline: 2px solid ${colors.accent1.val}; outline-offset: -4px; }
  `

  return (
    <Flex
      testID={TestID.LaunchesHero}
      position="relative"
      gap="$spacing16"
      p="$spacing24"
      borderRadius="$rounded24"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface1"
      overflow="hidden"
      hoverStyle={{ borderColor: '$surface3Hovered' }}
      $platform-web={{
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      }}
      $md={{ p: '$spacing16' }}
    >
      {/* Stretched over the card, under the pills, so `<a>` never nests `<a>`. First in the tab order. */}
      <style>{cardLinkFocusCss}</style>
      <Trace logPress element={ElementName.LaunchesHero}>
        <Anchor
          className="launches-hero-card-link"
          href={POOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('launches.hero.title')}
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          zIndex={0}
          borderRadius="$rounded24"
        />
      </Trace>
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing16" width="100%">
        <Flex row alignItems="center" gap="$spacing16" flexShrink={1} minWidth={0}>
          <Flex alignSelf="flex-start" flexShrink={0}>
            <LaunchesHeroNetworkLockup showArc={isArcEnabled} />
          </Flex>
          <Flex flexShrink={1} minWidth={0} gap="$spacing4">
            <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
              {t('launches.hero.title')}
            </Text>
            {/* <Trans> rather than t(): the wordmark is a component the copy positions itself, so
                  each locale decides where in its own sentence the lockup belongs. */}
            <Text variant="body2" color="$neutral2">
              {/* Trans splices the interpolated element into an array of text nodes, so it needs its own key.
                    Two literal i18nKeys rather than one computed key: the extractor only sees string literals. */}
              {isArcEnabled ? (
                <Trans
                  i18nKey="launches.hero.subtitleArcRobinhoodWithWordmark"
                  components={{ wordmark: <PoolsWordmark key="wordmark" /> }}
                />
              ) : (
                <Trans
                  i18nKey="launches.hero.subtitleRobinhoodWithWordmark"
                  components={{ wordmark: <PoolsWordmark key="wordmark" /> }}
                />
              )}
            </Text>
          </Flex>
        </Flex>
        {/* Decorative — the card's stretched link carries the name and the tab stop — so it's hidden
            from AT and out of the tab order; phone widths drop it for the text. */}
        <IconButton
          icon={<ArrowRight />}
          size="small"
          emphasis="secondary"
          borderRadius="$roundedFull"
          onPress={openPoolsInNewTab}
          tabIndex={-1}
          aria-hidden
          position="relative"
          zIndex={1}
          $sm={{ display: 'none' }}
        />
      </Flex>
      {launches.length > 0 && <QuickLaunchMarquee launches={launches} />}
    </Flex>
  )
}
