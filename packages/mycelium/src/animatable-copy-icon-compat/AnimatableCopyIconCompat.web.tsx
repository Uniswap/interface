/**
 * Web leg of the `AnimatableCopyIcon` compat (INFRA-3653) — the drop-in twin
 * of the legacy `ui/src` `AnimatableCopyIcon`: two absolutely-positioned
 * layers in a relative box sized to `size` — CopySheets fades out while
 * CheckmarkCircle fades in and rises
 * (`translateY 5 → 0`) when `isCopied` flips.
 *
 * Timing is the legacy driver's, number-exact: the layer leaving the visible
 * state runs the plain `200ms` curve while the layer entering waits out
 * `200msDelayed200ms`, both from `SPORE_ANIMATION_CURVE_CSS` (parity-pinned
 * against `ui/src/theme/animations/index.web.ts`). Transitions are scoped to
 * opacity/transform — the legacy `animateOnly` list, and the CLAUDE.md
 * non-color transition rule.
 */
import { isWebApp } from '@universe/environment'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import type { JSX } from 'react'
import { CheckmarkCircle } from '../components/icons/CheckmarkCircle'
import { CopySheets } from '../components/icons/CopySheets'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { COPY_ICON_CHECKMARK_COLOR, DEFAULT_COPY_ICON_COLOR, type CopyIconProps } from './props'

function crossfadeTransition(curve: '200ms' | '200msDelayed200ms'): string {
  return ['opacity', 'transform'].map((property) => `${property} ${SPORE_ANIMATION_CURVE_CSS[curve]}`).join(', ')
}

/**
 * The legacy `animation` prop values, as scoped transitions: `'200ms'` for
 * the layer changing now, `'200msDelayed200ms'` for the one waiting out the
 * crossfade. Module-private so the leg symbol sets stay identical
 * (platform-legs.test.ts); tests rebuild the strings from the curve map.
 */
const COPY_ICON_TRANSITIONS = {
  immediate: crossfadeTransition('200ms'),
  delayed: crossfadeTransition('200msDelayed200ms'),
} as const

export function AnimatableCopyIconCompat({
  isAnimated = isWebApp,
  isCopied,
  size,
  textColor = DEFAULT_COPY_ICON_COLOR,
  hideIcon,
  dataTestId,
}: CopyIconProps): JSX.Element {
  if (!isAnimated) {
    return (
      <FlexCompat position="relative" width={size} height={size}>
        {!hideIcon && <CopySheets color={textColor} size={size} data-testid={dataTestId} />}
      </FlexCompat>
    )
  }

  return (
    <FlexCompat position="relative" width={size} height={size}>
      {!hideIcon && (
        <FlexCompat
          position="absolute"
          top={0}
          left={0}
          opacity={isCopied ? 0 : 1}
          transition={isCopied ? COPY_ICON_TRANSITIONS.immediate : COPY_ICON_TRANSITIONS.delayed}
        >
          <CopySheets color={textColor} size={size} data-testid={dataTestId} />
        </FlexCompat>
      )}
      <FlexCompat
        position="absolute"
        top={0}
        left={0}
        opacity={isCopied ? 1 : 0}
        y={isCopied ? 0 : 5}
        transition={isCopied ? COPY_ICON_TRANSITIONS.delayed : COPY_ICON_TRANSITIONS.immediate}
      >
        <CheckmarkCircle color={COPY_ICON_CHECKMARK_COLOR} size={size} />
      </FlexCompat>
    </FlexCompat>
  )
}
