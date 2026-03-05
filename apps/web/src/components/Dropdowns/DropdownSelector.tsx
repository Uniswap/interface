import { Flex, Text } from 'ui/src'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { Check } from 'ui/src/components/icons/Check'
import { Dropdown, DropdownProps, InternalMenuItem } from '~/components/Dropdowns/Dropdown'

export interface SelectOption {
  label: string
  icon?: GeneratedIcon | null
}

type DropdownSelectorProps = Omit<DropdownProps, 'children' | 'menuLabel'> & {
  options: Record<string, SelectOption>
  selectedValue: string
  onSelect: (value: string) => void
  ButtonIcon: GeneratedIcon
  /** Test ID for the trigger button (e.g. "All transactions") */
  dataTestId?: string
  /** When set, each option gets data-testid={`${optionTestIdPrefix}${value}`} */
  optionTestIdPrefix?: string
}

export function DropdownSelector({
  options,
  selectedValue,
  onSelect,
  isOpen,
  toggleOpen,
  ButtonIcon,
  dataTestId,
  dropdownTestId,
  optionTestIdPrefix,
  adaptToSheet,
  tooltipText,
  dropdownStyle,
  containerStyle,
  alignRight = false,
  allowFlip,
  positionFixed,
  buttonStyle,
}: DropdownSelectorProps) {
  const selectedOption = options[selectedValue]

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={toggleOpen}
      dataTestId={dataTestId}
      menuLabel={
        <Flex row alignItems="center" gap="$gap8">
          <ButtonIcon size="$icon.20" color="$neutral1" />
          <Text variant="buttonLabel3">{selectedOption.label}</Text>
        </Flex>
      }
      buttonStyle={{
        minWidth: 140,
        height: 40,
        borderRadius: '$rounded12',
        borderWidth: '$spacing1',
        borderColor: '$surface3',
        ...buttonStyle,
      }}
      alignRight={alignRight}
      dropdownTestId={dropdownTestId}
      adaptToSheet={adaptToSheet}
      tooltipText={tooltipText}
      containerStyle={containerStyle}
      allowFlip={allowFlip}
      positionFixed={positionFixed}
      dropdownStyle={{ minWidth: 200, ...dropdownStyle }}
    >
      {Object.entries(options).map(([value, option]) => (
        <InternalMenuItem
          key={value}
          data-testid={optionTestIdPrefix ? `${optionTestIdPrefix}${value}` : undefined}
          onPress={() => {
            onSelect(value)
            toggleOpen(false)
          }}
        >
          <Flex row alignItems="center" gap="$gap8">
            {option.icon && <option.icon size="$icon.16" color="$neutral1" />}
            <Text variant="buttonLabel3">{option.label}</Text>
          </Flex>
          {selectedValue === value && <Check size="$icon.16" color="$accent1" strokeWidth={4} />}
        </InternalMenuItem>
      ))}
    </Dropdown>
  )
}
