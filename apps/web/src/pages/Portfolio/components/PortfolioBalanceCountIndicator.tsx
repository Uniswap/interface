import { Flex, Text } from 'ui/src'

export function PortfolioBalanceCountIndicator({ label }: { label: string }): JSX.Element {
  return (
    <Flex row alignItems="center">
      <Flex
        borderRadius="$roundedFull"
        backgroundColor="$neutral2"
        width="$spacing4"
        height="$spacing4"
        mx="$spacing8"
      />
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
    </Flex>
  )
}
