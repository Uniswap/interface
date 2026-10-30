import { isWebPlatform } from '@universe/environment'
import { Text, type TextCompatProps as TextProps, AnimatedFlex, type AnimatedFlexProps } from '@universe/mycelium'
import { fonts, spacing } from '@universe/mycelium/tokens'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

export function UnitagName({
  name,
  opacity = 1,
  animateText = false,
  animateIcon = false,
  displayIconInline = false,
  displayUnitagSuffix,
  textProps,
}: {
  name?: string
  opacity?: number
  animateText?: boolean
  animateIcon?: boolean
  displayIconInline?: boolean
  displayUnitagSuffix?: boolean
  textProps?: TextProps
}): JSX.Element {
  const iconContainerProps: AnimatedFlexProps = displayIconInline
    ? {}
    : {
        position: 'absolute',
        right: -spacing.spacing24,
        top: -spacing.spacing4,
      }

  // Reanimated legs of the legacy Tamagui 'lazy' enter/exit fade. Built only when animateText
  // requests it, matching enterStyle/exitStyle being `undefined` otherwise (no mount/unmount
  // transition at all in that case).
  const textEntering: EntryExitAnimationFunction | undefined = animateText
    ? () => {
        'worklet'
        return {
          initialValues: { opacity: 0 },
          animations: { opacity: withSporeCurve('lazy', opacity) },
        }
      }
    : undefined
  const textExiting: EntryExitAnimationFunction | undefined = animateText
    ? () => {
        'worklet'
        return {
          initialValues: { opacity },
          animations: { opacity: withSporeCurve('lazy', 0) },
        }
      }
    : undefined

  // Asymmetric slide (the legacy icon's own enterStyle/exitStyle direction): enters from the
  // right (x 20), exits to the left (x -20).
  const iconEntering: EntryExitAnimationFunction | undefined = animateIcon
    ? () => {
        'worklet'
        return {
          initialValues: { opacity: 0, transform: [{ scale: 0.8 }, { translateX: 20 }] },
          animations: {
            opacity: withSporeCurve('lazy', 1),
            transform: [{ scale: withSporeCurve('lazy', 1) }, { translateX: withSporeCurve('lazy', 0) }],
          },
        }
      }
    : undefined
  const iconExiting: EntryExitAnimationFunction | undefined = animateIcon
    ? () => {
        'worklet'
        return {
          initialValues: { opacity: 1, transform: [{ scale: 1 }, { translateX: 0 }] },
          animations: {
            opacity: withSporeCurve('lazy', 0),
            transform: [{ scale: withSporeCurve('lazy', 0.8) }, { translateX: withSporeCurve('lazy', -20) }],
          },
        }
      }
    : undefined

  // Web legs of the entering/exiting worklets above: AnimatedFlex ignores entering/exiting on web.
  // Gated the same way animateText gates the native worklets, so no-animation stays no-animation.
  // TODO(INFRA-4012): restore the web enter/exit pair once mycelium's animate-presence path lands.
  const textWebAnimationProps =
    animateText && isWebPlatform ? { animation: 'lazy' as const, animateOnly: ['opacity'] } : {}
  const iconWebAnimationProps =
    animateIcon && isWebPlatform
      ? {
          animation: 'lazy' as const,
          animateOnly: ['opacity', 'transform'],
        }
      : {}

  return (
    <AnimatedFlex
      row
      alignSelf="center"
      entering={textEntering}
      exiting={textExiting}
      opacity={opacity}
      alignItems="center"
      testID={`${name}${UNITAG_SUFFIX}`}
      {...textWebAnimationProps}
    >
      <Text
        color="$neutral1"
        fontFamily="$heading"
        fontWeight={fonts.heading2.fontWeight}
        lineHeight={fonts.heading2.lineHeight}
        {...textProps}
      >
        {name}
      </Text>
      {displayUnitagSuffix && (
        <Text
          color="$neutral2"
          fontFamily="$heading"
          fontWeight={fonts.heading2.fontWeight}
          lineHeight={fonts.heading2.lineHeight}
          {...textProps}
        >
          {UNITAG_SUFFIX}
        </Text>
      )}
      <AnimatedFlex
        {...iconContainerProps}
        row
        entering={iconEntering}
        exiting={iconExiting}
        ml="$spacing4"
        {...iconWebAnimationProps}
      >
        <Unitag size="$icon.24" />
      </AnimatedFlex>
    </AnimatedFlex>
  )
}
