import type { JSX } from 'react'
import { cn } from '../cn'
import { RESET_CLASSES } from '../compat/style-classes'
import { Shimmer } from '../shimmer'
import { TEXT_PLACEHOLDER_OVERLAY_CLASSES } from '../text-compat/compile'
import type { TextLoaderWrapperProps } from './TextLoaderWrapperProps'

/**
 * What the legacy Tamagui `Flex` contributes on web (react-native-web view
 * defaults) — the same recreation as TextCompat's loading placeholder and the
 * Shimmer wrapper.
 */
const VIEW_CLASSES = `flex flex-col items-stretch basis-auto ${RESET_CLASSES} shrink-0`

/**
 * Web `TextLoaderWrapper`: the legacy `ui/src` loading chrome
 * (`TextLoaderWrapper`/`TextPlaceholder` in `components/text/Text.tsx`),
 * recreated with the exact DOM TextCompat renders for its own `loading`
 * state — a row wrapper around the original children under the rounded
 * surface3 overlay bar — optionally wrapped in the shimmer sweep (the legacy
 * `Skeleton`). The children only size the bar: they're `visibility: hidden`,
 * so a stale value neither shows through the translucent dark overlay nor
 * reaches screen readers, as TextCompat's own placeholder and the native leg
 * already behave.
 */
export function TextLoaderWrapper({ children, loadingShimmer }: TextLoaderWrapperProps): JSX.Element {
  /* oxlint-disable react/forbid-elements -- recreates the legacy TextPlaceholder DOM (RNW Flex views) verbatim; mycelium has no Flex-with-view-defaults primitive */
  const placeholder = (
    <div className={`${VIEW_CLASSES} flex-row items-center`} data-testid="text-placeholder">
      <div className={`${VIEW_CLASSES} flex-row items-center`}>
        <div className={cn(VIEW_CLASSES, 'invisible')}>{children}</div>
        {/* cn() so the overlay's positioning wins over the view reset's, as in TextCompat. */}
        <div className={cn(VIEW_CLASSES, TEXT_PLACEHOLDER_OVERLAY_CLASSES)} />
      </div>
    </div>
  )
  /* oxlint-enable react/forbid-elements */
  if (loadingShimmer) {
    return <Shimmer>{placeholder}</Shimmer>
  }
  return placeholder
}
