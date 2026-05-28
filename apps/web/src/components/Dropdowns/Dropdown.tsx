import { useMemo } from 'react'
import { Flex, FlexProps, styled, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { AdaptiveDropdown, SharedDropdownProps } from '~/components/Dropdowns/AdaptiveDropdown'
import { TriggerButton } from '~/components/Dropdowns/TriggerButton'

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

export type DropdownProps = SharedDropdownProps & {
  menuLabel: JSX.Element | string
  dataTestId?: string
  hideChevron?: boolean
  chevronSize?: '$icon.16' | '$icon.20'
  isTriggerStyled?: boolean
  buttonStyle?: FlexProps
  transition?: FlexProps['transition']
}

export function Dropdown({
  menuLabel,
  dataTestId,
  hideChevron,
  chevronSize = '$icon.20',
  isTriggerStyled = true,
  buttonStyle,
  isOpen,
  toggleOpen,
  transition,
  ...rest
}: DropdownProps) {
  const Trigger = useMemo(
    () => (
      // @ts-expect-error -- Tamagui Text styled() prop widening regression with React 19.1 + RN 0.81 types
      <TriggerButton
        outlined={isTriggerStyled}
        onPress={() => toggleOpen(!isOpen)}
        active={isOpen && isTriggerStyled}
        aria-label={dataTestId}
        data-testid={dataTestId}
        {...buttonStyle}
        transition={transition}
      >
        <Flex row justifyContent="space-between" alignItems="center" gap="$gap8" width="100%">
          {typeof menuLabel === 'string' ? <Text>{menuLabel}</Text> : menuLabel}
          {!hideChevron && (
            <RotatableChevron
              animation="200ms"
              color="$neutral2"
              direction={isOpen ? 'up' : 'down'}
              size={chevronSize}
            />
          )}
        </Flex>
      </TriggerButton>
    ),
    [toggleOpen, isOpen, dataTestId, isTriggerStyled, buttonStyle, menuLabel, hideChevron, chevronSize, transition],
  )
  return <AdaptiveDropdown isOpen={isOpen} toggleOpen={toggleOpen} trigger={Trigger} {...rest} />
}
