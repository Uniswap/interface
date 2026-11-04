import { isWebApp } from '@universe/environment'
import { zIndexes } from '@universe/mycelium/tokens'
import { ComponentProps, ReactNode, useContext, useMemo } from 'react'
// oxlint-disable-next-line no-restricted-imports -- needed here
import {
  DualZIndexProvider,
  EffectiveModalOrSheetZIndexContext,
  stackingLayerAbove,
  WebBottomSheet,
} from 'ui/src/components/modal/AdaptiveWebModal'
import { Popover } from 'ui/src/components/popover/Popover'
import { mediaQueryFor, useMediaQueryMatch } from 'ui/src/components/popover/popoverWebHelpers'
import type { PopoverPlacement, PopoverPresenceStyle } from 'ui/src/components/popover/types'

const ANIMATION_OFFSET = 10

function getEnterExitStyle(placement?: PopoverPlacement): PopoverPresenceStyle {
  // Determine y offset based on vertical placement
  // When popover appears above trigger (top*): animate from below (positive y)
  // When popover appears below trigger (bottom*) or default: animate from above (negative y)
  const isAboveTrigger = placement?.startsWith('top')
  const yOffset = isAboveTrigger ? ANIMATION_OFFSET : -ANIMATION_OFFSET

  return {
    y: yOffset,
    opacity: 0,
  }
}

type AdaptiveWebPopoverContentProps = Omit<
  ComponentProps<typeof Popover.Content>,
  'children' | 'zIndex' | 'data-testid'
> & {
  children: ReactNode
  isOpen: boolean
  isSheet?: boolean
  adaptWhen?: boolean
  /** Placement of the popover relative to the trigger. Used to determine animation direction. */
  placement?: PopoverPlacement
  webBottomSheetProps?: Omit<ComponentProps<typeof WebBottomSheet>, 'children' | 'isOpen'>
}

/**
 * AdaptiveWebPopoverContent is a responsive popover component that adapts to different screen sizes.
 * On larger screens, it renders as a popover.
 * On smaller viewports (by default max-width ≤ `sm`), it adapts into a bottom sheet. Override with `adaptWhen`.
 *
 * Default z-index follows {@link EffectiveModalOrSheetZIndexContext} when inside an adaptive modal/sheet
 * so popovers and nested menus stack above the host layer.
 *
 * TODO(INFRA-4485): Move the remaining consumers to `AdaptiveWebPopoverContentCompat`, then delete this.
 *
 * @param isSheet - If true, always render as bottom sheet regardless of screen size
 * @deprecated Use `AdaptiveWebPopoverContentCompat` from `@universe/mycelium/popover-compat` instead.
 */
export function AdaptiveWebPopoverContent({
  children,
  isOpen,
  isSheet,
  adaptWhen,
  placement,
  webBottomSheetProps,
  ...popoverContentProps
}: AdaptiveWebPopoverContentProps): JSX.Element {
  // Same true-below-breakpoint semantics as the retired Tamagui `useMedia().sm`
  // (`sm` is a max-width query on `BREAKPOINT_PX.sm`).
  const isBelowSmBreakpoint = useMediaQueryMatch(mediaQueryFor('sm'))
  const useSheetOnWeb = adaptWhen ?? isBelowSmBreakpoint
  const effectiveModalZ = useContext(EffectiveModalOrSheetZIndexContext)
  const stackingLayerNumber = stackingLayerAbove(effectiveModalZ, zIndexes.popover)

  const enterExitStyle = useMemo(() => getEnterExitStyle(placement), [placement])

  return (
    <>
      {/* The legacy `animation` preset is retired: the rebuilt Content drives its fixed
          150ms transform/opacity transition from enterStyle/exitStyle alone. */}
      <Popover.Content
        zIndex={stackingLayerNumber}
        enterStyle={enterExitStyle}
        exitStyle={enterExitStyle}
        {...popoverContentProps}
      >
        <DualZIndexProvider value={stackingLayerNumber}>{children}</DualZIndexProvider>
      </Popover.Content>
      <Popover.Adapt when={isSheet ?? (isWebApp && useSheetOnWeb)}>
        <WebBottomSheet isOpen={isOpen} zIndex={stackingLayerNumber} {...(webBottomSheetProps || {})}>
          <DualZIndexProvider value={stackingLayerNumber}>
            <Popover.Adapt.Contents />
          </DualZIndexProvider>
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
