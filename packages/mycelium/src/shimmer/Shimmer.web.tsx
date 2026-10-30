import type { CSSProperties, JSX } from 'react'
import { cn } from '../cn'
import { RESET_CLASSES } from '../compat/style-classes'
import type { ShimmerProps } from './ShimmerProps'

/**
 * Keep in lockstep with the `myc-shimmer` keyframes in `shimmer.css`
 * (consumers import it once from their Tailwind entry stylesheet, next to
 * `@import "@universe/mycelium/tailwind"`).
 */
const KEYFRAMES_NAME = 'myc-shimmer'

const WEB_SHIMMER_DURATION_SECONDS = 1

/**
 * What the legacy Tamagui `Flex` wrapper contributes on web (react-native-web
 * view defaults) — same recreation as TextCompat's placeholder DOM. Exported
 * so the parity suite compiles exactly the classes the component renders.
 */
export const SHIMMER_WRAPPER_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * Same sweep as the legacy ui `Shine` it replaced: a translucent mask whose
 * position animates across the wrapped content.
 */
const SHIMMER_STYLE: CSSProperties = {
  WebkitMaskImage: 'linear-gradient(-75deg, rgba(0,0,0,0.5) 30%, #000 50%, rgba(0,0,0,0.5) 70%)',
  WebkitMaskSize: '200%',
  animationName: KEYFRAMES_NAME,
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
}

/**
 * Web `Shimmer`: masks the wrapped placeholder content and sweeps the mask via
 * a CSS animation — the same effect (and default timing) as the legacy
 * `Shine`/`Skeleton`. The wrapper renders even when `disabled` so children
 * keep their React identity across enable/disable toggles.
 */
export function Shimmer({
  children,
  disabled = false,
  shimmerDurationSeconds = WEB_SHIMMER_DURATION_SECONDS,
  animationDelay,
  className,
  testID,
  flexDirection,
  width,
  height,
  justifyContent,
  alignItems,
}: ShimmerProps): JSX.Element {
  // The layout slice merges straight into the wrapper's inline style — every
  // one of these is already a valid CSSProperties key, so no class compiler
  // is needed (INFRA-3822). Omitted entirely (not an all-undefined object)
  // when no layout prop is set, so a disabled Shimmer with no layout props
  // renders `style={undefined}` — byte-identical to the legacy Shine/Skeleton
  // wrapper's disabled style, which the mask-contract parity test pins.
  const layoutStyle: CSSProperties | undefined =
    flexDirection === undefined &&
    width === undefined &&
    height === undefined &&
    justifyContent === undefined &&
    alignItems === undefined
      ? undefined
      : { flexDirection, width, height, justifyContent, alignItems }
  return (
    // oxlint-disable-next-line react/forbid-elements -- the shimmer wrapper is a bare container (mycelium's layout primitives are out of scope here)
    <div
      className={cn(SHIMMER_WRAPPER_CLASSES, className)}
      data-testid={testID}
      style={
        disabled
          ? layoutStyle
          : { ...layoutStyle, ...SHIMMER_STYLE, animationDuration: `${shimmerDurationSeconds}s`, animationDelay }
      }
    >
      {children}
    </div>
  )
}
