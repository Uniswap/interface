import { ComponentProps, ReactNode } from 'react'
import { Popover } from 'tamagui'
// biome-ignore lint/style/noRestrictedImports: needed here
import { WebBottomSheet } from 'ui/src/components/modal/AdaptiveWebModal'
import { zIndexes } from 'ui/src/theme'

type AdaptiveWebPopoverContentProps = Omit<ComponentProps<typeof Popover.Content>, 'children'> & {
  children: ReactNode
  isOpen: boolean
  webBottomSheetProps?: Omit<ComponentProps<typeof WebBottomSheet>, 'children' | 'isOpen'>
}

/**
 * AdaptiveWebPopoverContent is a responsive popover component that adapts to different screen sizes.
 * On larger screens, it renders as a popover.
 * On smaller screens (mobile devices), it adapts into a bottom sheet.
 */

export function AdaptiveWebPopoverContent({
  children,
  isOpen,
  webBottomSheetProps,
  ...popoverContentProps
}: AdaptiveWebPopoverContentProps): JSX.Element {
  return (
    <>
      <Popover.Content zIndex={zIndexes.popover} {...popoverContentProps}>
        {children}
      </Popover.Content>
      <Popover.Adapt when="sm">
        <WebBottomSheet isOpen={isOpen} {...(webBottomSheetProps || {})}>
          <Popover.Adapt.Contents />
        </WebBottomSheet>
      </Popover.Adapt>
    </>
  )
}
