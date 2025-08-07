import { ArrowRight } from 'pages/Landing/components/Icons'
import { Flex, Text } from 'ui/src'

type PillButtonProps = {
  label: string
  icon: React.ReactNode
  color?: string
  cursor?: 'pointer' | 'default'
  onClick?: () => void
}

export function PillButton({ label, icon, color, onClick, cursor }: PillButtonProps) {
  return (
    <Flex
      px="$spacing16"
      py="$spacing12"
      borderRadius="$rounded24"
      gap="$gap8"
      centered
      cursor={cursor}
      borderWidth="$none"
      backgroundColor="$surface1"
      overflow="hidden"
      onPress={onClick}
      userSelect="none"
    >
      <Flex
        animation="quick"
        row
        centered
        gap="$gap8"
        $group-card-hover={{
          x: -24,
        }}
        hoverStyle={{
          x: -24,
        }}
      >
        <Flex animation="quick" opacity={1} $group-card-hover={{ opacity: 0 }}>
          {icon}
        </Flex>
        <Text
          fontSize={20}
          lineHeight={24}
          fontWeight="$medium"
          color={color}
          $xl={{
            fontSize: 18,
          }}
        >
          {label}
        </Text>
        <Flex
          animation="bouncy"
          opacity={0}
          width={24}
          mr={-24}
          $group-card-hover={{
            opacity: 1,
          }}
        >
          <Flex overflow="visible">
            <ArrowRight size="24" fill={color} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
