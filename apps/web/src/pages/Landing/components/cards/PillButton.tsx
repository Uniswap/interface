import { Flex, Text } from 'ui/src'
import { RightArrow } from 'ui/src/components/icons/RightArrow'

type PillButtonProps = {
  label: string
  icon?: React.ReactNode
  backgroundColor?: string
  color?: string
  cursor?: 'pointer' | 'default'
  onClick?: () => void
}

export function PillButton({ label, icon, color, onClick, cursor, backgroundColor }: PillButtonProps) {
  return (
    <Flex
      // padding and border radius are only needed if backgroundColor is provided to differentiate from the surface color
      px={backgroundColor ? '$spacing16' : 0}
      py={backgroundColor ? '$spacing12' : 0}
      borderRadius={backgroundColor ? '$rounded24' : undefined}
      gap="$gap8"
      centered
      cursor={cursor}
      borderWidth="$none"
      overflow="hidden"
      onPress={onClick}
      userSelect="none"
      backgroundColor={backgroundColor}
    >
      <Flex animation="quick" row centered gap="$gap8">
        {icon && <Flex>{icon}</Flex>}
        <Text variant="buttonLabel1" color={color}>
          {label}
        </Text>
        {!icon && <RightArrow size="$icon.24" color={color} />}
      </Flex>
    </Flex>
  )
}
