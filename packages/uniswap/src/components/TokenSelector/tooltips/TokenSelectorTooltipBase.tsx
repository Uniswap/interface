import { AnimateInOrder, Flex, Text, Tooltip, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { NewTag } from 'uniswap/src/components/pill/NewTag'

export const TOOLTIP_ICON_SIZE = 20

interface TokenSelectorTooltipBaseProps {
  icon: JSX.Element
  title: string
  subtitle: string
  actionElement: JSX.Element
  showNewTag?: boolean
  placement: {
    delayMs: number
    maxWidth: number
    left?: number
    top?: number
  }
  onPress: () => void
  onDismiss: () => void
}

export function TokenSelectorTooltipBase({
  icon,
  title,
  subtitle,
  actionElement,
  showNewTag = false,
  placement: { delayMs, maxWidth, left, top },
  onPress,
  onDismiss,
}: TokenSelectorTooltipBaseProps): JSX.Element {
  return (
    <AnimateInOrder index={1} delayMs={delayMs}>
      <Tooltip.Content maxWidth={maxWidth} p="$spacing12" left={left} top={top} onPress={(e) => e.stopPropagation()}>
        <Flex gap="$gap8">
          <Flex row gap="$gap8" width="100%" alignItems="center">
            {icon}
            <Text variant="body2" flex={1}>
              {title}
            </Text>
            {showNewTag && <NewTag />}
            <TouchableArea
              onPress={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
            >
              <X size="$icon.20" color="$neutral2" hoverColor="$neutral2Hovered" />
            </TouchableArea>
          </Flex>
          <Text variant="body4" color="$neutral2">
            {subtitle}
          </Text>
          <TouchableArea
            onPress={async (e) => {
              e.stopPropagation()
              onPress()
            }}
          >
            {actionElement}
          </TouchableArea>
        </Flex>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </AnimateInOrder>
  )
}
