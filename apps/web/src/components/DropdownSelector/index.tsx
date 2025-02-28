import { AdaptiveDropdown } from 'components/DropdownSelector/AdaptiveDropdown'
import FilterButton from 'components/DropdownSelector/FilterButton'
import { useMemo } from 'react'
import { Flex, FlexProps, Text, styled } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes } from 'ui/src/theme/iconSizes'

export const InternalMenuItem = styled(Text, {
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'space-between',
  px: '$spacing8',
  py: '$spacing12',
  gap: '$gap12',
  color: '$neutral1',
  textDecorationLine: 'none',
  cursor: 'pointer',
  borderRadius: '$rounded8',
  hoverStyle: {
    backgroundColor: '$surface3',
  },
  variants: {
    disabled: {
      true: {
        opacity: 0.6,
        cursor: 'default',
      },
    },
  } as const,
})

type DropdownSelectorProps = {
  isOpen: boolean
  toggleOpen: (open: boolean) => void
  menuLabel: JSX.Element | string
  dataTestId?: string
  dropdownTestId?: string
  tooltipText?: string
  hideChevron?: boolean
  buttonStyle?: FlexProps
  dropdownStyle?: FlexProps
  adaptToSheet?: boolean
  containerStyle?: React.CSSProperties
  alignRight?: boolean
  children: JSX.Element | JSX.Element[]
}

export function DropdownSelector({
  isOpen,
  toggleOpen,
  menuLabel,
  dataTestId,
  dropdownTestId,
  tooltipText,
  hideChevron,
  buttonStyle,
  dropdownStyle,
  adaptToSheet,
  containerStyle,
  alignRight,
  children,
}: DropdownSelectorProps) {
  const Trigger = useMemo(
    () => (
      <FilterButton
        onPress={() => toggleOpen(!isOpen)}
        active={isOpen}
        aria-label={dataTestId}
        data-testid={dataTestId}
        {...buttonStyle}
      >
        <Flex row justifyContent="space-between" alignItems="center" gap="$gap8" width="100%">
          {menuLabel}
          {!hideChevron && (
            <RotatableChevron
              animation="200ms"
              color="$neutral2"
              direction={isOpen ? 'up' : 'down'}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          )}
        </Flex>
      </FilterButton>
    ),
    [toggleOpen, isOpen, dataTestId, buttonStyle, menuLabel, hideChevron],
  )
  return (
    <AdaptiveDropdown
      isOpen={isOpen}
      toggleOpen={toggleOpen}
      trigger={Trigger}
      tooltipText={tooltipText}
      adaptToSheet={adaptToSheet}
      dropdownTestId={dropdownTestId}
      dropdownStyle={dropdownStyle}
      containerStyle={containerStyle}
      alignRight={alignRight}
    >
      {children}
    </AdaptiveDropdown>
  )
}
