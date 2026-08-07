import { Flex } from 'ui/src'
import { validColor } from 'ui/src/theme'

const BAR_HEIGHT = 6
// Glow at the fill head: 18px accent circle at 50%, blur(4px), with a gentle pulse.
const GLOW_SIZE = 18
const GLOW_OPACITY = 0.5
const GLOW_BLUR_PX = 4

// Subtle glow pulse; disabled for users preferring reduced motion.
const GLOW_PULSE_CSS = `
@keyframes launch-glow-pulse {
  0%, 100% { opacity: ${GLOW_OPACITY}; transform: scale(1); }
  50% { opacity: ${GLOW_OPACITY * 0.65}; transform: scale(0.9); }
}
.launch-glow-pulse { animation: launch-glow-pulse 3s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .launch-glow-pulse { animation: none; }
}
`

/**
 * Slim auction fill bar shared by the launch cards: 6px hairline pill track (1px surface3
 * border) with a rounded fill. `glowHead` adds the trending card's 18px glowing knob at the
 * fill head (default off). Regular cards keep the neutral surface3 fill.
 */
export function LaunchProgressBar({
  progressPct,
  color,
  glowHead = false,
  height = BAR_HEIGHT,
}: {
  /** Fill amount, 0–100. */
  progressPct: number
  /** Raw fill color (e.g. the trending green); defaults to the neutral surface3 fill. */
  color?: string
  glowHead?: boolean
  height?: number
}): JSX.Element {
  const clampedPct = Math.max(0, Math.min(100, progressPct))

  return (
    <Flex width="100%" height={height} position="relative">
      <Flex
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        borderColor="$surface3"
      />
      {clampedPct > 0 && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          height="100%"
          width={`${clampedPct}%`}
          borderRadius="$roundedFull"
          backgroundColor={color ? validColor(color) : '$surface3'}
        />
      )}
      {glowHead && clampedPct > 0 && color !== undefined && (
        <>
          {/* Keyframes + prefers-reduced-motion guard need a real style tag. */}
          <style>{GLOW_PULSE_CSS}</style>
          <Flex
            className="launch-glow-pulse"
            position="absolute"
            top={height / 2 - GLOW_SIZE / 2}
            width={GLOW_SIZE}
            height={GLOW_SIZE}
            borderRadius="$roundedFull"
            backgroundColor={validColor(color)}
            opacity={GLOW_OPACITY}
            pointerEvents="none"
            $platform-web={{
              left: `calc(${clampedPct}% - ${GLOW_SIZE / 2}px)`,
              filter: `blur(${GLOW_BLUR_PX}px)`,
            }}
          />
        </>
      )}
    </Flex>
  )
}
