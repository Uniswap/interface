import {
  Blur,
  Canvas,
  Group,
  Oval,
  RoundedRect,
  SkiaValue,
  useSharedValueEffect,
  useValue,
} from '@shopify/react-native-skia'
import { ResizeMode, Video } from 'expo-av'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'
import {
  AnimateStyle,
  Easing,
  EntryExitAnimationFunction,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import Trace from 'src/components/Trace/Trace'
import {
  flashWipeAnimation,
  letsGoButtonFadeIn,
  qrInnerBlurConfig,
  qrScaleIn,
  qrSlideUpAndFadeInConfig,
  qrSlideUpAtEnd,
  realQrFadeIn,
  realQrTopGlowFadeIn,
  textSlideUpAtEnd,
  videoFadeOut,
} from 'src/screens/Onboarding/QRAnimation/animations'
import {
  Button,
  Flex,
  getUniconV2Colors,
  Text,
  useIsDarkMode,
  useMedia,
  useSporeColors,
  useUniconColors,
} from 'ui/src'
import { ONBOARDING_QR_ETCHING_VIDEO_DARK, ONBOARDING_QR_ETCHING_VIDEO_LIGHT } from 'ui/src/assets'
import LockIcon from 'ui/src/assets/icons/lock.svg'
import { AnimatedFlex, flexStyles } from 'ui/src/components/layout'
import { fonts, iconSizes, opacify, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { Arrow } from 'wallet/src/components/icons/Arrow'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ElementName } from 'wallet/src/telemetry/constants'

export function QRAnimation({
  activeAddress,
  isNewWallet,
  onPressNext,
}: {
  activeAddress: string
  isNewWallet: boolean
  onPressNext: () => void
}): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const video = useRef<Video>(null)
  const media = useMedia()

  const isPlayingVideo = useSharedValue(false)

  const playEtchingAfterSlideIn = async (): Promise<void> => {
    await video.current?.playAsync().then(() => {
      isPlayingVideo.value = true
    })
  }

  const isDarkMode = useIsDarkMode()

  const etchingVideoSource = isDarkMode
    ? ONBOARDING_QR_ETCHING_VIDEO_DARK
    : ONBOARDING_QR_ETCHING_VIDEO_LIGHT

  // 2. QR slide up and fade in animation
  // the config for this animation is defined in the animations.ts file in the same folder as this component, but because of the callback it made more sense to leave the actual animation definition in this file
  const qrSlideUpAndFadeIn: EntryExitAnimationFunction = () => {
    'worklet'
    const animations: AnimateStyle<StyleProp<ViewStyle>> = {
      opacity: withDelay(
        qrSlideUpAndFadeInConfig.opacity.delay,
        withTiming(qrSlideUpAndFadeInConfig.opacity.endValue, {
          duration: qrSlideUpAndFadeInConfig.opacity.duration,
          easing: Easing.bezierFn(0.22, 1.0, 0.36, 1.0),
        })
      ),
      transform: [
        {
          translateY: withDelay(
            qrSlideUpAndFadeInConfig.translateY.delay,
            withTiming(qrSlideUpAndFadeInConfig.translateY.endValue, {
              duration: qrSlideUpAndFadeInConfig.translateY.duration,
              easing: Easing.bezierFn(0.22, 1.0, 0.36, 1.0),
            })
          ),
        },
      ],
    }
    // <StyleProp<ViewStyle>> doesn't quite work because of translateY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialValues: AnimateStyle<any> = {
      opacity: qrSlideUpAndFadeInConfig.opacity.startValue,
      transform: [{ translateY: qrSlideUpAndFadeInConfig.translateY.startValue }],
    }
    const callback = (finished: boolean): void => {
      if (finished) {
        runOnJS(playEtchingAfterSlideIn)()
      }
    }
    return {
      initialValues,
      animations,
      callback,
    }
  }

  // 4. QR code inner glow animation
  const reOpacity = useSharedValue(qrInnerBlurConfig.opacity.startValue)
  const preglowBlurOpacity = useValue(qrInnerBlurConfig.opacity.startValue)

  const reSize = useSharedValue(qrInnerBlurConfig.size.startValue)
  const preglowBlurSize = useValue(qrInnerBlurConfig.size.startValue)

  useEffect(() => {
    reOpacity.value = withDelay(
      qrInnerBlurConfig.opacity.delay,
      withTiming(qrInnerBlurConfig.opacity.endValue, {
        duration: qrInnerBlurConfig.opacity.duration,
      })
    )
  }, [reOpacity])

  useEffect(() => {
    reSize.value = withDelay(
      qrInnerBlurConfig.size.delay,
      withTiming(qrInnerBlurConfig.size.endValue, { duration: qrInnerBlurConfig.size.duration })
    )
  }, [reSize])

  // in order to animate React Native Skia values, we need to bind the Reanimated values to the React Native Skia values ("ra" = "reanimated")
  useSharedValueEffect(() => {
    preglowBlurOpacity.current = reOpacity.value
  }, reOpacity)

  useSharedValueEffect(() => {
    preglowBlurSize.current = reSize.value
  }, reSize)

  const videoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isPlayingVideo.value ? 1 : 0,
  }))

  // used throughout the page the get the size of the QR code container
  // setting as a constant so that it doesn't get defined by padding and screen size and give us less design control
  const QR_CONTAINER_SIZE = media.short ? 175 : 242
  const QR_CODE_SIZE = media.short ? 140 : 190
  const UNICON_SIZE = 64

  const uniconV1Colors = useUniconColors(activeAddress)
  const { color: uniconV2Color } = getUniconV2Colors(activeAddress)
  const isUniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)
  const uniconColors = isUniconsV2Enabled
    ? { gradientStart: uniconV2Color, gradientEnd: uniconV2Color, glow: uniconV2Color }
    : uniconV1Colors

  return (
    <>
      <AnimatedFlex entering={realQrTopGlowFadeIn}>
        <GradientBackground>
          <UniconThemedGradient
            borderRadius="$rounded16"
            gradientEndColor={uniconColors.glow}
            gradientStartColor={colors.surface1.val}
            opacity={isDarkMode ? 0.3 : 0.2}
          />
        </GradientBackground>
      </AnimatedFlex>
      <Flex grow justifyContent="space-between" pb="$spacing12" pt="$spacing24" px="$spacing16">
        <Flex centered grow gap="$spacing36" mb="$spacing12" mt="$spacing12">
          <Flex centered gap="$spacing12" pt="$spacing48">
            <AnimatedFlex entering={qrSlideUpAndFadeIn}>
              <AnimatedFlex centered entering={qrSlideUpAtEnd}>
                <AnimatedFlex entering={flashWipeAnimation} style={styles.behindQrBlur}>
                  <Canvas style={flexStyles.fill}>
                    <Group transform={[{ translateX: 50 }, { translateY: 50 }]}>
                      <RoundedRect
                        color={uniconColors.glow}
                        height={QR_CONTAINER_SIZE}
                        opacity={1}
                        r={10}
                        width={QR_CONTAINER_SIZE}
                        x={0}
                        y={0}
                      />
                      <Blur blur={25 as unknown as SkiaValue} />
                    </Group>
                  </Canvas>
                </AnimatedFlex>
                <AnimatedFlex entering={qrScaleIn}>
                  <Flex
                    backgroundColor="$surface1"
                    borderColor="$surface3"
                    borderRadius="$rounded20"
                    borderWidth={2}
                    height={QR_CONTAINER_SIZE}
                    overflow="hidden"
                    width={QR_CONTAINER_SIZE}>
                    <AnimatedFlex entering={realQrFadeIn} style={[styles.qrCodeContainer]}>
                      <QRCodeDisplay
                        hideOutline
                        address={activeAddress}
                        backgroundColor="$surface1"
                        color={isUniconsV2Enabled ? uniconV2Color : undefined}
                        containerBackgroundColor="$surface1"
                        logoSize={UNICON_SIZE}
                        safeAreaColor="$surface1"
                        size={QR_CODE_SIZE}
                      />
                    </AnimatedFlex>
                  </Flex>
                  <AnimatedFlex entering={videoFadeOut} style={styles.video}>
                    <AnimatedFlex style={[styles.video, videoAnimatedStyle]}>
                      <Video
                        ref={video}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={false}
                        source={etchingVideoSource}
                        style={styles.video}
                        useNativeControls={false}
                      />
                    </AnimatedFlex>
                  </AnimatedFlex>
                  <AnimatedFlex entering={videoFadeOut} style={[styles.glow]}>
                    <Canvas style={flexStyles.fill}>
                      <Group
                        transform={[
                          { translateX: QR_CONTAINER_SIZE / 2 - 40 },
                          { translateY: QR_CONTAINER_SIZE / 2 - 40 },
                        ]}>
                        <Oval
                          color={uniconColors.glow}
                          height={80}
                          opacity={preglowBlurOpacity}
                          width={80}
                        />
                        <Blur blur={preglowBlurSize as unknown as SkiaValue} />
                      </Group>
                    </Canvas>
                  </AnimatedFlex>
                  <AnimatedFlex entering={flashWipeAnimation} style={styles.glow}>
                    <Flex
                      borderRadius="$rounded20"
                      height="100%"
                      style={{
                        backgroundColor: uniconColors.glow,
                      }}
                      width="100%"
                    />
                  </AnimatedFlex>
                </AnimatedFlex>
              </AnimatedFlex>
            </AnimatedFlex>
            {/* negative top margin required because the glow around the QR code is absolute with -50 margin */}
            <AnimatedFlex entering={textSlideUpAtEnd} style={{ marginTop: -spacing.spacing48 }}>
              <Flex centered mt={-spacing.spacing4}>
                <AddressDisplay
                  showCopy
                  address={activeAddress}
                  captionTextColor="$neutral3"
                  captionVariant="subheading2"
                  showAccountIcon={false}
                  variant="heading3"
                />
              </Flex>
            </AnimatedFlex>
          </Flex>
          <AnimatedFlex entering={textSlideUpAtEnd} pt="$spacing4" style={[styles.textContainer]}>
            <Text
              $short={{ variant: 'subheading2' }}
              maxFontSizeMultiplier={media.short ? 1.1 : fonts.heading3.maxFontSizeMultiplier}
              pb="$spacing12"
              textAlign="center"
              variant="subheading1">
              {t('onboarding.wallet.title')}
            </Text>
            <Text
              $short={{ variant: 'body3' }}
              color="$neutral2"
              maxFontSizeMultiplier={media.short ? 1.1 : fonts.body1.maxFontSizeMultiplier}
              textAlign="center"
              variant="body2">
              {isNewWallet
                ? t('onboarding.wallet.description.new')
                : t('onboarding.wallet.description.existing')}
            </Text>
          </AnimatedFlex>
        </Flex>
        <AnimatedFlex entering={letsGoButtonFadeIn}>
          <Trace logPress element={ElementName.Next}>
            <Button
              icon={
                <Flex grow row alignItems="center" justifyContent="space-between">
                  <Flex row alignItems="center" gap="$spacing8">
                    <Flex
                      borderRadius="$roundedFull"
                      p="$spacing8"
                      style={{ backgroundColor: opacify(10, colors.sporeWhite.val) }}>
                      <LockIcon
                        color={colors.sporeWhite.val}
                        height={iconSizes.icon16}
                        width={iconSizes.icon16}
                      />
                    </Flex>
                    <Text color="$sporeWhite" variant="buttonLabel2">
                      {t('onboarding.wallet.continue')}
                    </Text>
                  </Flex>
                  <Arrow color={colors.sporeWhite.val} direction="e" size={iconSizes.icon24} />
                </Flex>
              }
              testID={ElementName.Next}
              onPress={onPressNext}
            />
          </Trace>
        </AnimatedFlex>
      </Flex>
    </>
  )
}

const styles = StyleSheet.create({
  behindQrBlur: {
    bottom: -50,
    left: -50,
    position: 'absolute',
    right: -50,
    top: -50,
    zIndex: -1,
  },
  glow: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  qrCodeContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginHorizontal: 28,
    marginTop: spacing.spacing60,
  },
  video: {
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
})
