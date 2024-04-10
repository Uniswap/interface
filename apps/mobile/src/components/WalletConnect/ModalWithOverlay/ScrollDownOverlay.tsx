import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeInDown, FadeOut } from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import {
  AnimatedFlex,
  Flex,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useSporeColors,
} from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

type ScrollDownOverlayProps = {
  scrollDownButonText?: string
  onScrollDownPress: () => void
}

export function ScrollDownOverlay({
  onScrollDownPress,
  scrollDownButonText,
}: ScrollDownOverlayProps): JSX.Element {
  const { t } = useTranslation()
  const { fullHeight, fullWidth } = useDeviceDimensions()
  const colors = useSporeColors()

  return (
    <AnimatedFlex
      alignItems="center"
      bottom={100}
      entering={FadeInDown}
      exiting={FadeOut}
      height={0.25 * fullHeight}
      justifyContent="flex-end"
      pb="$spacing24"
      pointerEvents="box-none"
      position="absolute"
      width="100%">
      <Flex pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg height="100%" width={fullWidth}>
          <Defs>
            <LinearGradient id="scroll-button-fadeout" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={colors.surface1.val} stopOpacity="0" />
              <Stop offset="0.75" stopColor={colors.surface1.val} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#scroll-button-fadeout)" height="100%" width="100%" x={0} y={0} />
        </Svg>
      </Flex>

      <TouchableArea alignItems="center" onPress={onScrollDownPress}>
        <Text color="$accent1" variant="buttonLabel3">
          {scrollDownButonText ?? t('common.button.scrollDown')}
        </Text>
        <ArrowDown color="$accent1" size={iconSizes.icon16} />
      </TouchableArea>
    </AnimatedFlex>
  )
}
