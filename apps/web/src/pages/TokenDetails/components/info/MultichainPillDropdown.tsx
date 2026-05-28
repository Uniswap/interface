import type React from 'react'
import type { ComponentProps } from 'react'
import { Popover, Text, TouchableArea, useMedia } from 'ui/src'
import { AdaptiveWebPopoverContent } from 'ui/src/components/popover/AdaptiveWebPopoverContent'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import type { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

type MultichainPillPopoverContentProps = Omit<ComponentProps<typeof AdaptiveWebPopoverContent>, 'children' | 'isOpen'>

export const tokenPillStyles = {
  row: true,
  alignItems: 'center' as const,
  gap: '$gap8' as const,
  backgroundColor: '$surface1' as const,
  borderRadius: '$rounded12' as const,
  borderWidth: 1,
  borderColor: '$surface3' as const,
  px: '$padding12' as const,
  py: '$padding8' as const,
  width: 'max-content',
}

export function TokenInfoButton({
  icon,
  iconRight,
  name,
  onPress,
  testID,
}: {
  icon: JSX.Element
  iconRight?: JSX.Element
  name: string
  onPress?: () => void
  testID?: string
}) {
  return (
    <TouchableArea {...tokenPillStyles} testID={testID} onPress={onPress}>
      {icon}
      <Text variant="buttonLabel3" color="$neutral1">
        {name}
      </Text>
      {iconRight}
    </TouchableArea>
  )
}

export function MultichainPillDropdown({
  testID,
  icon,
  name,
  isOpen,
  onOpenChange,
  popoverContentProps,
  modalName,
  children,
}: {
  testID: string
  icon: JSX.Element
  name: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  popoverContentProps: MultichainPillPopoverContentProps
  modalName: ModalNameType
  children: React.ReactNode
}) {
  const media = useMedia()

  const { webBottomSheetProps: sheetPropsFromParent, ...restPopoverContentProps } = popoverContentProps

  return (
    <Trace logImpression={isOpen} modal={modalName}>
      <Popover hoverable={!media.md} placement="top-start" offset={8} stayInFrame allowFlip onOpenChange={onOpenChange}>
        <Popover.Trigger>
          <TokenInfoButton testID={testID} icon={icon} name={name} />
        </Popover.Trigger>
        <AdaptiveWebPopoverContent
          isOpen={isOpen}
          {...restPopoverContentProps}
          adaptWhen={media.md}
          webBottomSheetProps={{
            maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`,
            ...sheetPropsFromParent,
            onClose: () => onOpenChange(false),
          }}
        >
          {children}
        </AdaptiveWebPopoverContent>
      </Popover>
    </Trace>
  )
}
