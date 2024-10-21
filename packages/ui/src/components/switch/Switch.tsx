import { useEffect, useState } from 'react'
import { ColorTokens, Switch as TamaguiSwitch, SwitchProps as TamaguiSwitchProps, getTokenValue } from 'tamagui'
import { Check } from 'ui/src/components/icons'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { SporeComponentVariant } from 'ui/src/components/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { isTestEnv } from 'utilities/src/environment/env'
import { isWeb } from 'utilities/src/platform'

export type SwitchProps = TamaguiSwitchProps & {
  variant: SporeComponentVariant
}

const animationProp =
  // TODO tamagui data-testid breaks with animation, this fixes tests
  isTestEnv()
    ? undefined
    : {
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
  ...rest
}: SwitchProps): JSX.Element {
  const [checked, setChecked] = useState(checkedProp)
  const colors = useSporeColors()
  const isBranded = variant === 'branded'

  useEffect(() => {
    setChecked(checkedProp)
  }, [checkedProp])

  const onCheckedChange = (val: boolean): void => {
    setChecked(val)
    onCheckedChangeProp?.(val)
  }

  const THUMB_HEIGHT = getTokenValue('$spacing24')
  const THUMB_PADDING = getTokenValue('$spacing4')
  const TRACK_HEIGHT = THUMB_HEIGHT + THUMB_PADDING * 2

  const frameBackgroundColor = ((): ColorTokens => {
    if (disabled) {
      return '$surface3'
    }
    if (isBranded) {
      return checked ? '$accent1' : '$neutral3'
    }
    return checked ? '$accent3' : '$neutral3'
  })()

  const thumbBackgroundColor = ((): ColorTokens => {
    if (disabled) {
      if (isBranded) {
        return checked ? '$neutral2' : '$neutral3'
      }
      return checked ? '$neutral2' : '$neutral3'
    }
    if (isBranded) {
      return checked ? '$white' : '$neutral1'
    }
    return checked ? '$surface1' : '$neutral1'
  })()

  const iconColor = ((): string => {
    if (disabled) {
      return colors.white.val
    }
    return isBranded ? colors.accent1.val : colors.neutral1.val
  })()

  // Switch is a bit performance sensitive on native, memo to help here
  const frameActiveStyle = {
    x: checked ? -2 : 0,
  }

  const outerActiveStyle = {
    width: 28,
    x: checked ? -4 : 0,
  }

  return (
    <TamaguiSwitch
      alignItems="center"
      {...animationProp}
      aria-disabled={disabled}
      aria-selected={checked}
      backgroundColor={frameBackgroundColor}
      borderWidth={0}
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
      minHeight={TRACK_HEIGHT}
      minWidth="$spacing60"
      p="$spacing4"
      pointerEvents={disabled ? 'none' : 'auto'}
      onCheckedChange={disabled ? undefined : onCheckedChange}
      {...rest}
    >
      <TamaguiSwitch.Thumb
        alignItems="center"
        {...animationProp}
        backgroundColor={thumbBackgroundColor}
        justifyContent="center"
        minHeight={THUMB_HEIGHT}
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
          minHeight={THUMB_HEIGHT}
          position="absolute"
          width="$spacing24"
          zIndex={-2}
        />
      </TamaguiSwitch.Thumb>

      {isWeb &&
        ((): JSX.Element => {
          const OUTER_RING_DISTANCE = -6
          const INNER_RING_DISTANCE = -5

          return (
            <>
              {/* focus ring outer */}
              <Flex
                $group-item-focus={{
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
                borderWidth={1}
                bottom={OUTER_RING_DISTANCE}
                left={OUTER_RING_DISTANCE}
                position="absolute"
                right={OUTER_RING_DISTANCE}
                top={OUTER_RING_DISTANCE}
                zIndex={-2}
              />

              {/* focus ring inner */}
              <Flex
                $group-item-focus={{
                  borderColor: isBranded ? '$surface1' : '$surface1',
                }}
                borderColor="transparent"
                borderRadius="$roundedFull"
                borderWidth={2}
                bottom={INNER_RING_DISTANCE}
                left={INNER_RING_DISTANCE}
                position="absolute"
                right={INNER_RING_DISTANCE}
                top={INNER_RING_DISTANCE}
                zIndex={-1}
              />
            </>
          )
        })()}
    </TamaguiSwitch>
  )
}
