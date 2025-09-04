import { ReactElement, useMemo, useState } from 'react'
import {
  AnimatePresence,
  GetThemeValueForKey,
  getTokenValue,
  Checkbox as TamaguiCheckbox,
  CheckboxProps as TamaguiCheckboxPops,
} from 'tamagui'
import { Check } from 'ui/src/components/icons'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { SporeComponentVariant } from 'ui/src/components/types'
import { IconSizeTokens } from 'ui/src/theme'
import { isTestEnv } from 'utilities/src/environment/env'
import { v4 as uuid } from 'uuid'

type CheckboxSizes = {
  FocusRing: number
  CheckboxButton: number
  CheckSizeDefault: number
  CheckSizePressed: number
  UnselectedHoverIndicator: number
  UnselectedPressedIndicator: number
}

function getSizes(size?: IconSizeTokens): CheckboxSizes {
  const buttonSize = size ? getTokenValue(size) : 20
  return {
    FocusRing: Math.round(buttonSize * 1.3),
    CheckboxButton: buttonSize, // Default 20
    CheckSizeDefault: buttonSize - 4,
    CheckSizePressed: buttonSize - 2,
    UnselectedHoverIndicator: Math.round(buttonSize * 0.2),
    UnselectedPressedIndicator: Math.round(buttonSize * 0.3),
  }
}

export type CheckboxSizeTokens = '$icon.16' | '$icon.18' | '$icon.20'

type CheckboxProps = {
  variant?: SporeComponentVariant
  checked: boolean
  size?: CheckboxSizeTokens
} & Omit<TamaguiCheckboxPops, 'size'>

const animationProp = isTestEnv() ? undefined : ({ animation: 'simple' } satisfies FlexProps['animation'])

/**
 * Spore Checkbox
 *
 * @param checked - boolean value that determines if the checkbox is checked
 * @param variant - determines the color of the button in the selected state (branded is pink)
 * @param size - determines size of the checkbox - currently supports $icon.16 $icon.18 $icon.20
 * @returns
 */
export function Checkbox({ checked, variant = 'default', size = '$icon.20', ...rest }: CheckboxProps): ReactElement {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const accentColor = getAccentColor(variant, isHovered)
  const sizes = useMemo(() => getSizes(size), [size])

  return (
    // This outer ring is only shown when the button is focused.
    <Flex
      alignItems="center"
      {...animationProp}
      borderColor={getFocusedRingColor({ variant, isFocused, isSelected: checked, accentColor })}
      borderRadius="$rounded6"
      borderWidth="$spacing1"
      height={sizes.FocusRing}
      justifyContent="center"
      width={sizes.FocusRing}
      testID={rest.testID}
    >
      <TamaguiCheckbox
        {...rest}
        unstyled
        alignItems="center"
        animation="simple"
        backgroundColor="transparent"
        borderColor={rest.disabled ? '$neutral3' : checked ? accentColor : '$neutral2'}
        borderRadius="$rounded4"
        borderWidth="$spacing2"
        checked={checked}
        cursor="pointer"
        disabledStyle={{
          borderColor: '$neutral3',
        }}
        height={sizes.CheckboxButton}
        hoverStyle={{
          borderColor: checked ? accentColor : '$neutral2',
        }}
        justifyContent="center"
        pointerEvents={rest.disabled ? 'none' : 'auto'}
        width={sizes.CheckboxButton}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        onMouseDown={() => setIsPressed(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseUp={() => setIsPressed(false)}
      >
        {/* TamaguiCheckbox.Indicator is a container around the inner checkmark icon which is shown when the item is selected. */}
        <TamaguiCheckbox.Indicator
          unstyled
          alignItems="center"
          animation="simple"
          backgroundColor={rest.disabled ? '$neutral3' : accentColor}
          height={sizes.CheckSizePressed}
          justifyContent="center"
          width={sizes.CheckSizePressed}
        >
          <Check
            color={rest.disabled ? '$neutral2' : variant === 'branded' ? 'white' : '$surface1'}
            size={isPressed ? sizes.CheckSizePressed : sizes.CheckSizeDefault}
          />
        </TamaguiCheckbox.Indicator>
        {/* This is an inner dot shown in in *unselected* hovered states. */}
        {!checked && (
          <AnimatePresence initial>
            {isHovered && !rest.disabled && (
              <Flex
                key={`UnselectedHoverIndicator-${uuid()}`}
                animation="simple"
                backgroundColor="$neutral2"
                borderRadius="$roundedFull"
                enterStyle={{ scale: 0 }}
                exitStyle={{ scale: 0 }}
                height={isPressed ? sizes.UnselectedPressedIndicator : sizes.UnselectedHoverIndicator}
                position="absolute"
                width={isPressed ? sizes.UnselectedPressedIndicator : sizes.UnselectedHoverIndicator}
              />
            )}
          </AnimatePresence>
        )}
      </TamaguiCheckbox>
    </Flex>
  )
}

function getAccentColor(variant: SporeComponentVariant, isHovered: boolean): GetThemeValueForKey<'backgroundColor'> {
  if (variant === 'branded') {
    return isHovered ? '$accent1Hovered' : '$accent1'
  }
  return isHovered ? '$accent3Hovered' : '$accent3'
}

function getFocusedRingColor({
  variant,
  isFocused,
  isSelected,
  accentColor,
}: {
  variant: SporeComponentVariant
  isFocused: boolean
  isSelected: boolean
  accentColor: GetThemeValueForKey<'backgroundColor'>
}): GetThemeValueForKey<'borderColor'> {
  if (!isFocused) {
    return 'transparent'
  }
  if (variant === 'branded') {
    return isSelected ? accentColor : '$neutral3'
  }
  return '$neutral3'
}
