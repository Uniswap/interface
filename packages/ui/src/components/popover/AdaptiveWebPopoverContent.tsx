import { ComponentProps, ReactNode, useMemo } from 'react'
import { GetProps, Popover, useMedia } from 'tamagui'
// biome-ignore lint/style/noRestrictedImports: needed here
import { WebBottomSheet } from 'ui/src/components/modal/AdaptiveWebModal'
import { zIndexes } from 'ui/src/theme'
import { isWebApp } from 'utilities/src/platform'

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

type AdaptiveWebPopoverContentProps = Omit<ComponentProps<typeof Popover.Content>, 'children'> & {
  children: ReactNode
  isOpen: boolean
  isSheet?: boolean
  /** Placement of the popover relative to the trigger. Used to determine animation direction. */
  placement?: PopoverPlacement
  webBottomSheetProps?: Omit<ComponentProps<typeof WebBottomSheet>, 'children' | 'isOpen'>
}

/**
 * AdaptiveWebPopoverContent is a responsive popover component that adapts to different screen sizes.
 * On larger screens, it renders as a popover.
 * On smaller screens (mobile devices), it adapts into a bottom sheet.
 *
 * @param isSheet - If true, always render as bottom sheet regardless of screen size
 */

export function AdaptiveWebPopoverContent({
  children,
  isOpen,
  isSheet,
  placement,
  webBottomSheetProps,
  ...popoverContentProps
}: AdaptiveWebPopoverContentProps): JSX.Element {
  const media = useMedia()

  const enterExitStyle = useMemo(() => getEnterExitStyle(placement), [placement])

  return (
    <>
      <Popover.Content
        zIndex={zIndexes.popover}
        animation={defaultPopoverAnimation}
        enterStyle={enterExitStyle}
        exitStyle={enterExitStyle}
        {...popoverContentProps}
      >
        {children}
      </Popover.Content>
      <Popover.Adapt when={isSheet ?? (isWebApp && media.sm)}>
        <WebBottomSheet isOpen={isOpen} {...(webBottomSheetProps || {})}>
          <Popover.Adapt.Contents />
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
