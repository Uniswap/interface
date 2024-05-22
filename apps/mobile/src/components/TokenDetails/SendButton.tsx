import React from 'react'
import { Flex, TouchableArea } from 'ui/src'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { iconSizes } from 'ui/src/theme'
import { ElementName } from 'wallet/src/telemetry/constants'

type Props = {
  onPress: () => void
  size?: number
  color?: string
}

export function SendButton({ onPress, color, size = iconSizes.icon24 }: Props): JSX.Element {
  return (
    <TouchableArea
      hapticFeedback
      hitSlop={16}
      p="$spacing4"
      testID={ElementName.Send}
      onPress={onPress}>
      <Flex centered row gap="$spacing8">
        <SendIcon color={color} height={size} width={size} />
      </Flex>
    </TouchableArea>
  )
}
