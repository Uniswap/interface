import { Flex, Text } from 'ui/src'

interface CompactLayoutProps {
  typeLabel: string
  logo: React.ReactNode
  amountText: string | null
}

export function CompactLayout({ typeLabel, logo, amountText }: CompactLayoutProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap8">
      {logo}
      <Flex>
        <Text variant="body4" color="$neutral2">
          {typeLabel}
        </Text>
        {amountText && (
          <Text variant="body3" color="$neutral1">
            {amountText}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
