import { ShadowProps, useResponsiveProp } from '@shopify/restyle'
import { selectionAsync } from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useColorScheme } from 'react-native'
import { TapGestureHandler, TapGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, Rect, Stop, SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedBox, Box, BoxProps } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { prepareSwapFormState } from 'src/features/transactions/swap/utils'
import { dimensions } from 'src/styles/sizing'
import { theme as FixedTheme, Theme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'

export const TAB_NAVIGATOR_HEIGHT_XS = 52
export const TAB_NAVIGATOR_HEIGHT_SM = 72

const SWAP_BUTTON_CONTAINER_WIDTH = dimensions.fullWidth / 3 + FixedTheme.spacing.spacing24

export const SWAP_BUTTON_HEIGHT = 56
const SWAP_BUTTON_WIDTH = 108
const SWAP_BUTTON_SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 4 }

export const TabBarButton = memo(
  ({
    focused,
    IconFilled,
    Icon,
    ...rest
  }: {
    focused: boolean
    IconFilled: React.FC<SvgProps>
    Icon: React.FC<SvgProps>
  } & BoxProps) => {
    const appTheme = useAppTheme()

    return (
      <Box
        alignItems="center"
        flex={1}
        justifyContent="center"
        mb={{ xs: 'spacing4', sm: 'spacing16' }}
        position="relative"
        {...rest}>
        {focused ? (
          <IconFilled color={appTheme.colors.magentaVibrant} height={appTheme.iconSizes.icon24} />
        ) : (
          <Icon color={appTheme.colors.textTertiary} height={appTheme.iconSizes.icon24} />
        )}
        <Box
          backgroundColor="userThemeColor"
          borderRadius="roundedFull"
          bottom={-1 * appTheme.spacing.spacing4}
          height={4}
          opacity={focused ? 1 : 0}
          width={4}
        />
      </Box>
    )
  }
)

type SwapTabBarButtonProps = {
  /**
   * The value to scale to when the Pressable is being pressed.
   * @default 0.95
   */
  activeScale?: number
  inputCurrencyId?: CurrencyId
} & WithSpringConfig

export const SwapTabBarButton = memo(
  ({ activeScale = 0.95, inputCurrencyId }: SwapTabBarButtonProps) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const appTheme = useAppTheme()
    const isDarkMode = useColorScheme() === 'dark'

    const buttonOffset = useResponsiveProp({
      xs:
        -1 *
        (TAB_NAVIGATOR_HEIGHT_XS -
          SWAP_BUTTON_HEIGHT +
          appTheme.spacing.spacing24 +
          appTheme.spacing.spacing4),
      sm: -1 * (TAB_NAVIGATOR_HEIGHT_SM - SWAP_BUTTON_HEIGHT + appTheme.spacing.spacing2),
    })

    const onPress = useCallback(() => {
      selectionAsync()

      dispatch(
        openModal({
          name: ModalName.Swap,
          initialState: prepareSwapFormState({ inputCurrencyId }),
        })
      )
    }, [dispatch, inputCurrencyId])

    const scale = useSharedValue(1)
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }), [scale])
    const onGestureEvent = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
      onStart: () => {
        cancelAnimation(scale)
        scale.value = withSpring(activeScale)
      },
      onEnd: () => {
        runOnJS(onPress)()
      },
      onFinish: () => {
        cancelAnimation(scale)
        scale.value = withSpring(1)
      },
    })

    return (
      <Box
        alignItems="center"
        bg="background0"
        pointerEvents="box-none"
        position="relative"
        width={SWAP_BUTTON_CONTAINER_WIDTH}>
        <TapGestureHandler onGestureEvent={onGestureEvent}>
          <AnimatedBox
            alignItems="center"
            height={SWAP_BUTTON_HEIGHT}
            justifyContent="center"
            position="absolute"
            shadowColor="shadowBranded"
            shadowOffset={SWAP_BUTTON_SHADOW_OFFSET}
            shadowOpacity={isDarkMode ? 0.6 : 0.4}
            shadowRadius={20}
            style={[animatedStyle]}
            top={buttonOffset}
            width={SWAP_BUTTON_WIDTH}>
            <Box
              borderRadius="rounded32"
              bottom={0}
              left={0}
              overflow="hidden"
              position="absolute"
              right={0}
              top={0}>
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="background" x1="0%" x2="0%" y1="0%" y2="100%">
                    <Stop offset="0" stopColor="#F160F9" stopOpacity="1" />
                    <Stop offset="1" stopColor="#FB36D0" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#background)" height="100%" opacity={1} width="100%" x="0" y="0" />
              </Svg>
            </Box>
            <Text color="textOnBrightPrimary" variant="buttonLabelMedium">
              {t('Swap')}
            </Text>
          </AnimatedBox>
        </TapGestureHandler>
      </Box>
    )
  }
)
