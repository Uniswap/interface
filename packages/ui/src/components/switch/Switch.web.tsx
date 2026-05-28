import { useEffect, useState } from 'react'
import { type OpaqueColorValue } from 'react-native'
import type { ColorTokens, GetThemeValueForKey } from 'tamagui'
import { Switch as TamaguiSwitch } from 'tamagui'
import { Check } from 'ui/src/components/icons'
import type { FlexProps } from 'ui/src/components/layout'
import { Flex } from 'ui/src/components/layout'
import { SWITCH_THUMB_HEIGHT, SWITCH_TRACK_HEIGHT, SWITCH_TRACK_WIDTH } from 'ui/src/components/switch/shared'
import type { SwitchProps } from 'ui/src/components/switch/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

const animationProp = {
  animation: [
    '80ms-ease-in-out',
    {
      backgroundColor: {
        overshootClamping: true,
      },
    },
  ] satisfies FlexProps['animation'],
}

export function Switch({
  checked: checkedProp,
  onCheckedChange: onCheckedChangeProp,
  disabled,
  variant,
  disabledStyle,
  backgroundColor,
  ...rest
}: SwitchProps): JSX.Element {
  const [checked, setChecked] = useState(checkedProp)
  const colors = useSporeColors()
  const isBranded = variant === 'branded'

  useEffect(() => {
    setChecked(checkedProp)
  }, [checkedProp])

  const onCheckedChange = (val: boolean): void => {
    // If the checked prop is undefined, we are in an uncontrolled state
    // and should update the internal state
    // Otherwise, we are in a controlled state and should not update the internal state
    // (because the checked prop will be updated from the outside)
    if (typeof checkedProp === 'undefined') {
      setChecked(val)
    }
    onCheckedChangeProp?.(val)
  }

  const isDisabledStyling = disabled && !checked

  const frameBackgroundColor = ((): ColorTokens | OpaqueColorValue | GetThemeValueForKey<'backgroundColor'> => {
    if (backgroundColor) {
      return backgroundColor
    }

    if (isDisabledStyling) {
      return '$surface3'
    }
    if (isBranded) {
      return checked ? '$accent1' : '$neutral3'
    }
    return checked ? '$accent3' : '$neutral3'
  })()

  const thumbBackgroundColor = ((): ColorTokens => {
    if (isDisabledStyling) {
      return '$neutral3'
    }

    if (checked) {
      return isBranded ? '$white' : '$surface1'
    }

    return '$white'
  })()

  const iconColor = ((): string => {
    if (isDisabledStyling) {
      return colors.white.val
    }
    return isBranded ? colors.accent1.val : colors.neutral1.val
  })()

  const frameActiveStyle = {
    x: checked ? -2 : 0,
  }

  const outerActiveStyle = {
    width: 28,
    x: checked ? -4 : 0,
  }

  const OUTER_RING_DISTANCE = -6
  const INNER_RING_DISTANCE = -5

  return (
    <TamaguiSwitch
      alignItems="center"
      {...animationProp}
      aria-disabled={disabled}
      aria-selected={checked}
      backgroundColor={frameBackgroundColor}
      borderWidth="$none"
      checked={checked}
      defaultChecked={checked}
      group="item"
      hoverStyle={{
        backgroundColor: isBranded
          ? checked
            ? '$accent1Hovered'
            : '$neutral3Hovered'
          : checked
            ? '$accent3Hovered'
            : '$neutral3Hovered',
        cursor: 'pointer',
      }}
      justifyContent="center"
      minHeight={SWITCH_TRACK_HEIGHT}
      minWidth={SWITCH_TRACK_WIDTH}
      p="$spacing4"
      pointerEvents={disabled ? 'none' : 'auto'}
      disabledStyle={{
        ...(checked && { opacity: 0.6 }),
        ...disabledStyle,
      }}
      onCheckedChange={disabled ? undefined : onCheckedChange}
      {...rest}
    >
      <TamaguiSwitch.Thumb
        alignItems="center"
        {...animationProp}
        backgroundColor={thumbBackgroundColor}
        justifyContent="center"
        minHeight={SWITCH_THUMB_HEIGHT}
        width="$spacing24"
      >
        <Flex
          $group-item-hover={frameActiveStyle}
          $group-item-press={frameActiveStyle}
          animation="100ms"
          opacity={checked ? 1 : 0}
        >
          <Check color={iconColor} size={14} />
        </Flex>

        {/* fake thumb for width animation */}
        <Flex
          $group-item-hover={outerActiveStyle}
          $group-item-press={outerActiveStyle}
          {...animationProp}
          backgroundColor={thumbBackgroundColor}
          borderRadius="$roundedFull"
          inset={0}
          minHeight={SWITCH_THUMB_HEIGHT}
          position="absolute"
          width="$spacing24"
          zIndex={-2}
        />
      </TamaguiSwitch.Thumb>

      <>
        {/* focus ring outer */}
        <Flex
          $group-item-focusVisible={{
            borderColor: checked
              ? isBranded
                ? '$accent1Hovered'
                : '$neutral3Hovered'
              : isBranded
                ? '$neutral3Hovered'
                : '$neutral3Hovered',
          }}
          borderColor="transparent"
          borderRadius="$roundedFull"
          borderWidth="$spacing1"
          bottom={OUTER_RING_DISTANCE}
          left={OUTER_RING_DISTANCE}
          position="absolute"
          right={OUTER_RING_DISTANCE}
          top={OUTER_RING_DISTANCE}
          zIndex={-2}
        />

        {/* focus ring inner */}
        <Flex
          $group-item-focusVisible={{
            borderColor: isBranded ? '$surface1' : '$surface1',
          }}
          borderColor="transparent"
          borderRadius="$roundedFull"
          borderWidth="$spacing2"
          bottom={INNER_RING_DISTANCE}
          left={INNER_RING_DISTANCE}
          position="absolute"
          right={INNER_RING_DISTANCE}
          top={INNER_RING_DISTANCE}
          zIndex={-1}
        />
      </>
    </TamaguiSwitch>
  )
}
