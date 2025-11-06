import { Dropdown, DropdownProps, InternalMenuItem } from 'components/Dropdowns/Dropdown'
import { Flex, Text } from 'ui/src'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { Check } from 'ui/src/components/icons/Check'

export interface SelectOption {
  label: string
  icon?: GeneratedIcon | null
}

type DropdownSelectorProps = Omit<DropdownProps, 'children' | 'menuLabel'> & {
  options: Record<string, SelectOption>
  selectedValue: string
  onSelect: (value: string) => void
  ButtonIcon: GeneratedIcon
}

export function DropdownSelector({
  options,
  selectedValue,
  onSelect,
  isOpen,
  toggleOpen,
  ButtonIcon,
  dropdownTestId,
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
