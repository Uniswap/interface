import { colors } from '@universe/cli/src/ui/utils/colors'
import { Text } from 'ink'
import SelectInput, { type IndicatorProps, type ItemProps } from 'ink-select-input'

interface SelectItem {
  label: string
  value: string
}

interface SelectProps {
  items: SelectItem[]
  onSelect: (item: SelectItem) => void
}

/**
 * Themed SelectInput wrapper with Uniswap pink highlighting
 */
export function Select({ items, onSelect }: SelectProps): JSX.Element {
  // Custom item component with pink color
  const itemComponent = ({ isSelected, label }: ItemProps): JSX.Element => (
    <Text color={isSelected ? colors.primary : undefined}>
      {isSelected ? '❯ ' : '  '}
      {label}
    </Text>
  )

  // Empty indicator component to disable default blue chevron
  const indicatorComponent = (_props: IndicatorProps): JSX.Element => <></>

  return (
    <SelectInput
      items={items}
      itemComponent={itemComponent}
      indicatorComponent={indicatorComponent}
      onSelect={onSelect}
    />
  )
}
