import { isWebApp } from '@universe/environment'
import { ComponentProps, ReactNode, useContext, useMemo } from 'react'
import { GetProps, Popover, useMedia } from 'tamagui'
// oxlint-disable-next-line no-restricted-imports -- needed here
import { EffectiveModalOrSheetZIndexContext, WebBottomSheet } from 'ui/src/components/modal/AdaptiveWebModal'
import { zIndexes } from 'ui/src/theme'

const ANIMATION_OFFSET = 10

const defaultPopoverAnimation: GetProps<typeof Popover.Content>['animation'] = [
  'quick',
  {
    opacity: {
      overshootClamping: true,
    },
  },
]

type PopoverPlacement = ComponentProps<typeof Popover>['placement']

function getEnterExitStyle(placement?: PopoverPlacement): GetProps<typeof Popover.Content>['enterStyle'] {
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

type AdaptiveWebPopoverContentProps = Omit<ComponentProps<typeof Popover.Content>, 'children' | 'zIndex'> & {
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
 * @param isSheet - If true, always render as bottom sheet regardless of screen size
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
  const media = useMedia()
  const useSheetOnWeb = adaptWhen ?? media.sm
  const effectiveModalZ = useContext(EffectiveModalOrSheetZIndexContext)
  const stackingLayerNumber = Math.max((effectiveModalZ ?? 0) + 1, zIndexes.popover)

  const enterExitStyle = useMemo(() => getEnterExitStyle(placement), [placement])

  return (
    <>
      <Popover.Content
        zIndex={stackingLayerNumber}
        animation={defaultPopoverAnimation}
        enterStyle={enterExitStyle}
        exitStyle={enterExitStyle}
        {...popoverContentProps}
      >
        <EffectiveModalOrSheetZIndexContext.Provider value={stackingLayerNumber}>
          {children}
        </EffectiveModalOrSheetZIndexContext.Provider>
      </Popover.Content>
      <Popover.Adapt when={isSheet ?? (isWebApp && useSheetOnWeb)}>
        <WebBottomSheet isOpen={isOpen} zIndex={stackingLayerNumber} {...(webBottomSheetProps || {})}>
          <EffectiveModalOrSheetZIndexContext.Provider value={stackingLayerNumber}>
            <Popover.Adapt.Contents />
          </EffectiveModalOrSheetZIndexContext.Provider>
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
