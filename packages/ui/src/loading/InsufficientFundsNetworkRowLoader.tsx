import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'

export const InsufficientFundsNetworkRowLoader = ({ opacity }: { opacity: number }): JSX.Element => {
  return (
    <Flex
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      opacity={opacity}
      py="$spacing8"
    >
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <Flex
          backgroundColor="$neutral3"
          borderRadius="$rounded8"
          height={iconSizes.icon24}
          width={iconSizes.icon24}
          ml="$spacing6"
        />
        <Flex shrink alignItems="flex-start" ml="$spacing4">
          <Text loading loadingPlaceholderText="Network Name" variant="body2" />
        </Flex>
      </Flex>
      <Flex justifyContent="space-between" position="relative">
        <Flex centered fill>
          <Text loading loadingPlaceholderText="Ready to disable" variant="body3" />
        </Flex>
      </Flex>
    </Flex>
  )
}
