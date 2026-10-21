import { Flex, type FlexCompatProps, Text, type TextCompatProps } from '@universe/mycelium'
import { GeneratedIcon } from 'ui/src/components/factories/createIcon'
import { Check } from 'ui/src/components/icons/Check'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { Dropdown, DropdownProps, InternalMenuItem } from '~/components/Dropdowns/Dropdown'

export const SMALL_DROPDOWN_BUTTON_STYLE = {
  height: 32,
  minWidth: 0,
  pl: '$spacing12',
  gap: '$spacing6',
} satisfies TextCompatProps

export const SMALL_DROPDOWN_MENU_STYLE = { minWidth: 120 } satisfies FlexCompatProps

export interface SelectOption {
  label: string
  icon?: GeneratedIcon | null
  /** Logs an element press for this option. */
  traceElement?: ElementName
}

type DropdownSelectorProps = Omit<DropdownProps, 'children' | 'menuLabel'> & {
  options: Record<string, SelectOption>
  selectedValue: string
  onSelect: (value: string) => void
  ButtonIcon?: GeneratedIcon
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
  forceFlipUp,
  matchTriggerWidth,
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
        <Flex row alignItems="center" gap="$gap8" flexShrink={1} minWidth={0}>
          {ButtonIcon && (
            <Flex flexShrink={0}>
              <ButtonIcon size="$icon.20" color="$neutral1" />
            </Flex>
          )}
          <Text variant="buttonLabel3" numberOfLines={1}>
            {selectedOption.label}
          </Text>
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
      forceFlipUp={forceFlipUp}
      matchTriggerWidth={matchTriggerWidth}
      positionFixed={positionFixed}
      dropdownStyle={{ minWidth: 200, ...dropdownStyle }}
    >
      {Object.entries(options).map(([value, option]) => (
        <Trace key={value} logPress={!!option.traceElement} element={option.traceElement}>
          <InternalMenuItem
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
        </Trace>
      ))}
    </Dropdown>
  )
}
