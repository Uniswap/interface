import { Flex, Text } from '@universe/mycelium'

export function PriceRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Flex row gap="$spacing8">
      <Text variant="body2">{label}</Text>
      <Text variant="body2">{value}</Text>
    </Flex>
  )
}
