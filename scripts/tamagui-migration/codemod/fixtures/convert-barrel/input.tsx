import { Flex, Text } from 'ui/src'

export function PriceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Flex row gap="$spacing8">
      <Text variant="body2">{label}</Text>
      <Text variant="body2">{value}</Text>
    </Flex>
  )
}
