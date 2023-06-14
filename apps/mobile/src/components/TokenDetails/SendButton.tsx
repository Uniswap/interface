import React from 'react'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'
import SendIcon from 'ui/assets/icons/send-action.svg'
import { iconSizes } from 'ui/theme/iconSizes'

type Props = {
  onPress: () => void
  size?: number
  color?: string
}

export function SendButton({ onPress, color, size = iconSizes.icon24 }: Props): JSX.Element {
  return (
    <TouchableArea hapticFeedback name={ElementName.Send} padding="spacing4" onPress={onPress}>
      <Flex centered row gap="spacing8">
        <SendIcon color={color} height={size} width={size} />
      </Flex>
    </TouchableArea>
  )
}
