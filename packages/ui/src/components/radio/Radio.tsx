import { createContext, PropsWithChildren, ReactElement, useContext, useState } from 'react'
import { AnimatePresence, GetThemeValueForKey, RadioGroup, RadioGroupItemProps, RadioGroupProps } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { SporeComponentVariant } from 'ui/src/components/types'

// Used to pass the selected value of the RadioGroup down to the RadioButtons.
const RadioButtonGroupContext = createContext<string | undefined>(undefined)

type RadioButtonGroupProps = PropsWithChildren<RadioGroupProps>

/**
 * The container for RadioButtons that handles the state of the selected button.
 *
 * @param orientation - the direction in which the radio buttons are laid out
 */
export function RadioButtonGroup(props: RadioButtonGroupProps): ReactElement {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(props.defaultValue)
  return (
    <RadioButtonGroupContext.Provider value={selectedValue}>
      <RadioGroup
        {...props}
        flexDirection={props.orientation === 'horizontal' ? 'row' : 'column'}
        onValueChange={(selected) => {
          props.onValueChange?.(selected)
          setSelectedValue(selected)
        }}
      >
        {props.children}
      </RadioGroup>
    </RadioButtonGroupContext.Provider>
  )
}

const sizes = {
  FocusRing: 26,
  RadioButton: 20,
  IndicatorSizeDefault: 10,
  IndicatorSizeHovered: 12,
  IndicatorSizePressed: 14,
  UnselectedHoverIndicator: 4,
  UnselectedPressedIndicator: 6,
}

type RadioButtonProps = {
  variant?: SporeComponentVariant
} & RadioGroupItemProps

/**
 * Spore Radio Button
 *
 * Must be used within the provided RadioButtonGroup.
 * example usage:
 *
 * ```tsx
 * <RadioButtonGroup defaultValue="option1" onValueChange={<set managed state here>}>
 *  <RadioButton value="option1" variant="branded" />
 *  <RadioButton value="option2" />
 *
 *  // You can also listen for specific button presses:
 *  <RadioButton value="option3" onPress={<do something specific for option3>} />
 *
 * </RadioButtonGroup>
 *
 * @param value - the unique value for this RadioButton within it's containing RadioGroup
 * @param variant - determines the color of the button in the selected state (branded is pink)
 * @returns
 */
export function RadioButton({ value, variant = 'default', ...rest }: RadioButtonProps): ReactElement {
  const id = `radiogroup-${value}`

  const selectedValue = useContext(RadioButtonGroupContext)
  const isSelected = selectedValue === value
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const accentColor = getAccentColor(variant, isHovered)

  const indicatorSize = isPressed
    ? sizes.IndicatorSizePressed
    : isHovered
      ? sizes.IndicatorSizeHovered
      : sizes.IndicatorSizeDefault
  const unselectedHoverIndicatorSize = isPressed ? sizes.UnselectedPressedIndicator : sizes.UnselectedHoverIndicator

  // RadioGroup.Item is the outer container of the button.
  return (
    <RadioGroup.Item
      {...rest}
      unstyled
      alignItems="center"
      animation="simple"
      backgroundColor="transparent"
      borderColor={isSelected ? accentColor : '$neutral2'}
      borderRadius="$roundedFull"
      borderWidth="$spacing2"
      cursor="pointer"
      disabledStyle={{
        borderColor: '$neutral3',
      }}
      height={sizes.RadioButton}
      hoverStyle={{
        borderColor: isSelected ? accentColor : '$neutral2',
      }}
      id={id}
      justifyContent="center"
      value={value}
      width={sizes.RadioButton}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onMouseDown={() => setIsPressed(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseUp={() => setIsPressed(false)}
    >
      {/* RadioGroup.Indicator is the inner dot which is shown when the item is selected. */}
      <RadioGroup.Indicator
        unstyled
        animation="simple"
        backgroundColor={rest.disabled ? '$neutral3' : accentColor}
        borderRadius="$roundedFull"
        height={indicatorSize}
        width={indicatorSize}
      />
      {/* This is an inner dot shown in in *unselected* hovered/focused states. */}
      {!isSelected && (
        <AnimatePresence initial>
          {isHovered && !rest.disabled && (
            <Flex
              key={`UnselectedHoverIndicator-${value}`}
              animation="simple"
              backgroundColor="$neutral2"
              borderRadius="$roundedFull"
              enterStyle={{ scale: 0 }}
              exitStyle={{ scale: 0 }}
              height={unselectedHoverIndicatorSize}
              position="absolute"
              width={unselectedHoverIndicatorSize}
            />
          )}
        </AnimatePresence>
      )}
      {/* This outer ring is only shown when the button is focused. */}
      <Flex
        alignItems="center"
        animation="simple"
        borderColor={getFocusedRingColor({ variant, isFocused, isSelected, accentColor })}
        borderRadius="$roundedFull"
        borderWidth="$spacing1"
        height={sizes.FocusRing}
        justifyContent="center"
        position="absolute"
        width={sizes.FocusRing}
      />
    </RadioGroup.Item>
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
