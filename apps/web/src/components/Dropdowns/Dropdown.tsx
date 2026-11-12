import { Flex, Text, type TextCompatProps } from '@universe/mycelium'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { type ComponentProps, useMemo } from 'react'
import { AdaptiveDropdown, SharedDropdownProps } from '~/components/Dropdowns/AdaptiveDropdown'
import { TriggerButton } from '~/components/Dropdowns/TriggerButton'

export type InternalMenuItemProps = TextCompatProps & {
  disabled?: boolean
  ref?: ComponentProps<typeof Text>['ref']
}

export function InternalMenuItem({ disabled, ref, ...rest }: InternalMenuItemProps): JSX.Element {
  return (
    <Text
      ref={ref}
      display="flex"
      flex={1}
      alignItems="center"
      justifyContent="space-between"
      px="$spacing8"
      py="$spacing12"
      gap="$gap12"
      color="$neutral1"
      textDecorationLine="none"
      cursor="pointer"
      userSelect="none"
      borderRadius="$rounded8"
      hoverStyle={{ backgroundColor: '$surface3' }}
      {...(disabled === true ? { opacity: 0.6, cursor: 'default' } : {})}
      {...rest}
    />
  )
}

export type DropdownProps = SharedDropdownProps & {
  menuLabel: JSX.Element | string
  dataTestId?: string
  hideChevron?: boolean
  chevronSize?: '$icon.16' | '$icon.20'
  isTriggerStyled?: boolean
  buttonStyle?: TextCompatProps
  transition?: TextCompatProps['transition']
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
              color="$neutral2"
              direction={isOpen ? 'up' : 'down'}
              size={chevronSize}
              // Replaces the legacy 200ms Tamagui transition; scoped to transform so theme-token colors never transition
              style={{ transition: `transform ${SPORE_ANIMATION_CURVE_CSS['200ms']}` }}
            />
          )}
        </Flex>
      </TriggerButton>
    ),
    [toggleOpen, isOpen, dataTestId, isTriggerStyled, buttonStyle, menuLabel, hideChevron, chevronSize, transition],
  )
  return <AdaptiveDropdown isOpen={isOpen} toggleOpen={toggleOpen} trigger={Trigger} {...rest} />
}
