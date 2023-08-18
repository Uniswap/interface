import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { iconSizes } from 'ui/src/theme'

type Props = {
  onPress: () => void
  size?: number
  color?: string
}

export function SendButton({ onPress, color, size = iconSizes.icon24 }: Props): JSX.Element {
  return (
    <TouchableArea hapticFeedback padding="spacing4" testID={ElementName.Send} onPress={onPress}>
      <Flex centered row gap="spacing8">
        <SendIcon color={color} height={size} width={size} />
      </Flex>
    </TouchableArea>
  )
}
