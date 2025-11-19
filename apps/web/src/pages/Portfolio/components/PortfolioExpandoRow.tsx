import { Flex, Text, TouchableArea } from 'ui/src'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'

interface PortfolioExpandoRowProps {
  isExpanded: boolean
  label: string
  onPress: () => void
}

export function PortfolioExpandoRow({ isExpanded, label, onPress }: PortfolioExpandoRowProps): JSX.Element {
  return (
    <TouchableArea onPress={onPress} row gap="$gap8" p="$spacing16">
      <Text variant="body2" color="$neutral2">
        {label}
      </Text>
      <Flex justifyContent="center" testID="expando-row-icon">
        {isExpanded ? (
          <AnglesDownUp color="$neutral2" size="$icon.20" />
        ) : (
          <SortVertical color="$neutral2" size="$icon.20" />
        )}
      </Flex>
    </TouchableArea>
  )
}
