import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Text, useIsDarkMode } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { opacifyRaw, validColor } from 'ui/src/theme'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  POOLS_TEASER_BACKGROUND_DARK,
  POOLS_TEASER_BACKGROUND_LIGHT,
  POOLS_TEASER_BORDER_DARK,
  POOLS_TEASER_BORDER_LIGHT,
  POOLS_URL,
} from '~/pages/Launches/constants'

// Design-specified values with no matching theme token; kept raw rather than snapped to a nearby token.
const BANNER_MIN_HEIGHT = 104
const BANNER_MAX_WIDTH = 1200
const BANNER_BORDER_RADIUS = 28
const BANNER_INSET = 24
const BANNER_INSET_MD = 16
const ARROW_SIZE = 48
const ARROW_BLUR_PX = 4
const ARROW_GAP = 12

// Ripple arcs: 21 concentric rings sharing a centre below the banner's bottom edge, so they read as
// arcs rising from beneath. Same stroke in both themes — the light/dark difference is background + scrim.
const RIPPLE_STROKE = '#95D028'
const RIPPLE_CENTER_LEFT_PCT = 33.7
const RIPPLE_CENTER_TOP = 122.3
const RIPPLE_HOVER_SCALE = 1.1
const RIPPLE_STAGGER_MS = 18
// $stiff — the repo's snappy curve (packages/ui/src/theme/animations).
const RIPPLE_ENTRANCE = '150ms cubic-bezier(0.17, 0.67, 0.45, 1)'
// $quick — softer ease-out, so the wider hover travel doesn't read as harsh.
const RIPPLE_HOVER = '200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'

/** radius / stroke width / resting opacity, innermost first — the stagger follows this order. */
const RIPPLES: { radius: number; strokeWidth: number; opacity: number }[] = [
  { radius: 60.734, strokeWidth: 1.50896, opacity: 1 },
  { radius: 189.223, strokeWidth: 1.75661, opacity: 1 },
  { radius: 278.873, strokeWidth: 1.53475, opacity: 1 },
  { radius: 350.972, strokeWidth: 1.35632, opacity: 1 },
  { radius: 411.417, strokeWidth: 1.20672, opacity: 1 },
  { radius: 463.165, strokeWidth: 1.07866, opacity: 1 },
  { radius: 508.0, strokeWidth: 0.9677, opacity: 1 },
  { radius: 547.121, strokeWidth: 0.87088, opacity: 1 },
  { radius: 581.386, strokeWidth: 0.78608, opacity: 1 },
  { radius: 611.437, strokeWidth: 0.71171, opacity: 1 },
  { radius: 637.778, strokeWidth: 0.64652, opacity: 1 },
  { radius: 660.807, strokeWidth: 0.58953, opacity: 1 },
  { radius: 680.852, strokeWidth: 0.53992, opacity: 1 },
  { radius: 698.182, strokeWidth: 0.49703, opacity: 0.85 },
  { radius: 713.03, strokeWidth: 0.46028, opacity: 0.7 },
  { radius: 725.59, strokeWidth: 0.4292, opacity: 0.6 },
  { radius: 736.031, strokeWidth: 0.40336, opacity: 0.5 },
  { radius: 744.5, strokeWidth: 0.3824, opacity: 0.45 },
  { radius: 751.128, strokeWidth: 0.366, opacity: 0.4 },
  { radius: 756.536, strokeWidth: 0.35411, opacity: 0.35 },
  { radius: 760.73, strokeWidth: 0.34642, opacity: 0.2 },
]

// Square canvas centred on the shared ripple origin, so every ring is concentric about its own
// bounding-box centre and the SVG keeps a 1:1 aspect (rings stay circular at any banner width).
const RIPPLE_ORIGIN = Math.max(...RIPPLES.map((ripple) => ripple.radius))
const RIPPLE_CANVAS = RIPPLE_ORIGIN * 2

// The launches column caps at 1200px inclusive of its 40px gutters, so the banner's widest realized
// width is 1120 — 1118 inside its 1px border — not BANNER_MAX_WIDTH. Anchoring the canvas there keeps
// desktop at scale 1; the min() below makes "never larger than authored" structural, not arithmetic.
const BANNER_DESKTOP_WIDTH = 1120
const BANNER_BORDER = 1
const RIPPLE_CANVAS_WIDTH_PCT = (RIPPLE_CANVAS / (BANNER_DESKTOP_WIDTH - BANNER_BORDER * 2)) * 100

const STAGGERED_RIPPLES = RIPPLES.map((ripple, index) => ({ ...ripple, delayMs: index * RIPPLE_STAGGER_MS }))
// Outermost first so the tight core paints on top; the delays still ascend inner-to-outer.
const RIPPLE_DRAW_ORDER = [...STAGGERED_RIPPLES.slice(1).reverse(), ...STAGGERED_RIPPLES.slice(0, 1)]

/**
 * `from`-only keyframe: the implicit `to` resolves to each circle's own computed transform (identity)
 * and opacity, so one keyframe drives all 21 rings to their individual resting opacities — and
 * `animation: none` under reduced motion leaves them at exactly that resting state.
 */
const RIPPLE_CSS = `
@keyframes pools-teaser-ripple-in {
  from { transform: scale(0); opacity: 0; }
}
.pools-teaser-ripple {
  transform-origin: ${RIPPLE_ORIGIN}px ${RIPPLE_ORIGIN}px;
  animation: pools-teaser-ripple-in ${RIPPLE_ENTRANCE} backwards;
}
.pools-teaser-ripples {
  transform-origin: ${RIPPLE_ORIGIN}px ${RIPPLE_ORIGIN}px;
  transition: transform ${RIPPLE_HOVER};
}
.pools-teaser-banner:hover .pools-teaser-ripples {
  transform: scale(${RIPPLE_HOVER_SCALE});
}
@media (prefers-reduced-motion: reduce) {
  .pools-teaser-ripple { animation: none; }
  .pools-teaser-ripples { transition: none; }
  .pools-teaser-banner:hover .pools-teaser-ripples { transform: none; }
}
`

/**
 * The ripple field. Rings are drawn outermost-first so the tight core lands on top, while the
 * entrance stagger runs innermost-first so the cascade travels outward.
 */
function RippleField(): JSX.Element {
  // translate(-50%, -50%) recentres the canvas on the shared origin whatever its size: 33.7% across
  // the banner and a fixed 122.3px down (below the bottom edge). Square via aspectRatio, so the
  // viewBox scale stays uniform and the rings never become ovals.
  return (
    <Flex
      position="absolute"
      top={RIPPLE_CENTER_TOP}
      left={`${RIPPLE_CENTER_LEFT_PCT}%`}
      aspectRatio={1}
      zIndex={0}
      pointerEvents="none"
      $platform-web={{
        width: `min(${RIPPLE_CANVAS}px, ${RIPPLE_CANVAS_WIDTH_PCT}%)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <style>{RIPPLE_CSS}</style>
      <svg width="100%" height="100%" viewBox={`0 0 ${RIPPLE_CANVAS} ${RIPPLE_CANVAS}`} fill="none" aria-hidden="true">
        <g className="pools-teaser-ripples" stroke={RIPPLE_STROKE} strokeLinecap="round" fill="none">
          {RIPPLE_DRAW_ORDER.map((ripple) => (
            <circle
              key={ripple.radius}
              className="pools-teaser-ripple"
              cx={RIPPLE_ORIGIN}
              cy={RIPPLE_ORIGIN}
              r={ripple.radius}
              strokeWidth={ripple.strokeWidth}
              vectorEffect="non-scaling-stroke"
              style={{ opacity: ripple.opacity, animationDelay: `${ripple.delayMs}ms` }}
            />
          ))}
        </g>
      </svg>
    </Flex>
  )
}

/**
 * Pre-launch teaser for pools.xyz, shown in place of {@link LaunchesHero} behind the
 * `enable_pools_xyz_teaser` flag: brand-green frame, a "Coming soon" badge over the headline, and a
 * field of ripple arcs that cascade out from beneath the left third and emerge past the scrim on the
 * right. Non-interactive until `POOLS_URL` is filled in, so it never looks clickable but dead.
 */
export function LaunchesTeaserBanner(): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()

  const background = isDarkMode ? POOLS_TEASER_BACKGROUND_DARK : POOLS_TEASER_BACKGROUND_LIGHT
  const borderColor = isDarkMode ? POOLS_TEASER_BORDER_DARK : POOLS_TEASER_BORDER_LIGHT
  // Hides the ripples behind the copy, clearing to nothing on the right so they read there. Fades to
  // a zero-alpha brand hex rather than `transparent`, which some engines interpolate through black.
  // The design's progressive background blur is intentionally not approximated here — see the PR notes.
  const scrim = isDarkMode
    ? `linear-gradient(90deg, #131313 0%, ${opacifyRaw(0, '#131313')} 100%)`
    : `linear-gradient(90deg, #FDFFFB 0%, ${opacifyRaw(0, '#CDFF90')} 100%)`
  const badgeBackground = opacifyRaw(isDarkMode ? 12 : 24, '#B1F13C')
  const badgeLabel = isDarkMode ? '#95D028' : '#619600'
  const headline = isDarkMode ? '#FFFFFF' : '#131313'
  const arrowFill = isDarkMode ? opacifyRaw(12, '#FFFFFF') : opacifyRaw(8, '#131313')
  const arrowGlyph = isDarkMode ? '#FFFFFF' : '#131313'

  // Link and arrow are the same fact: with no destination the banner shows no affordance at all, and
  // the copy reclaims the arrow's gutter. Everything below keys off this one value.
  const hasDestination = Boolean(POOLS_URL)

  const banner = (
    <Flex
      testID={TestID.LaunchesTeaserBanner}
      className="pools-teaser-banner"
      position="relative"
      width="100%"
      maxWidth={BANNER_MAX_WIDTH}
      minHeight={BANNER_MIN_HEIGHT}
      borderRadius={BANNER_BORDER_RADIUS}
      borderWidth="$spacing1"
      borderColor={validColor(borderColor)}
      overflow="hidden"
      $platform-web={{ background }}
    >
      <RippleField />
      <Flex
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        pointerEvents="none"
        zIndex={1}
        $platform-web={{ background: scrim }}
      />
      {/* Right padding reserves the arrow's gutter so a wrapped headline never runs under it. */}
      <Flex
        zIndex={2}
        gap="$spacing12"
        pt={BANNER_INSET}
        pb={BANNER_INSET}
        pl={BANNER_INSET}
        pr={hasDestination ? BANNER_INSET + ARROW_SIZE + ARROW_GAP : BANNER_INSET}
        $md={{
          pt: BANNER_INSET_MD,
          pb: BANNER_INSET_MD,
          pl: BANNER_INSET_MD,
          pr: hasDestination ? BANNER_INSET_MD + ARROW_SIZE + ARROW_GAP : BANNER_INSET_MD,
        }}
      >
        <Flex
          alignSelf="flex-start"
          px="$spacing6"
          py="$spacing2"
          borderRadius="$rounded6"
          backgroundColor={validColor(badgeBackground)}
        >
          <Text variant="body4" color={validColor(badgeLabel)}>
            {t('launches.teaser.badge')}
          </Text>
        </Flex>
        <Text variant="subheading1" color={validColor(headline)} $md={{ variant: 'body2' }}>
          {t('launches.teaser.title')}
        </Text>
      </Flex>
      {hasDestination && (
        <Flex
          position="absolute"
          top={BANNER_INSET}
          right={BANNER_INSET}
          zIndex={2}
          width={ARROW_SIZE}
          height={ARROW_SIZE}
          borderRadius="$roundedFull"
          alignItems="center"
          justifyContent="center"
          backgroundColor={validColor(arrowFill)}
          $md={{ top: BANNER_INSET_MD, right: BANNER_INSET_MD }}
          $platform-web={{ backdropFilter: `blur(${ARROW_BLUR_PX}px)` }}
        >
          <ArrowRight size="$icon.20" color={validColor(arrowGlyph)} />
        </Flex>
      )}
    </Flex>
  )

  if (!hasDestination) {
    return banner
  }

  return (
    <Trace logPress element={ElementName.LaunchesTeaserBanner}>
      <Anchor
        href={POOLS_URL}
        target="_blank"
        rel="noopener noreferrer"
        textDecorationLine="none"
        display="flex"
        width="100%"
      >
        {banner}
      </Anchor>
    </Trace>
  )
}
