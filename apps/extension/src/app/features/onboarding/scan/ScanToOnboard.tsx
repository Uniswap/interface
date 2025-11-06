import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/springUtils'
import QRCode from 'react-qr-code' //TODO(EXT-476): Replace with custom QR code designs
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useScantasticContext } from 'src/app/features/onboarding/scan/ScantasticContextProvider'
import { getScantasticUrl } from 'src/app/features/onboarding/scan/utils'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import UAParser from 'ua-parser-js'
import { Flex, Image, Square, Text, TouchableArea, useSporeColors } from 'ui/src'
import { DOT_GRID, UNISWAP_LOGO } from 'ui/src/assets'
import { FileListLock, Mobile, RotatableChevron, Wifi } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'

const UNISWAP_LOGO_SIZE = 52
const UNISWAP_LOGO_SCALE_LOADING = 1.2
const UNISWAP_LOGO_SCALE_DEFAULT = 1
const QR_CODE_SIZE = 212

function useDocumentVisibility(): boolean {
  const [isDocumentVisible, setIsDocumentVisible] = useState(!document.hidden)

  const handleVisibilityChange = (): void => {
    setIsDocumentVisible(!document.hidden)
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleVisibilityChange is created fresh each render but behavior stays the same
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isDocumentVisible
}

export function ScanToOnboard(): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const { goToNextStep } = useOnboardingSteps()
  const isDocumentVisible = useDocumentVisibility()

  const { sessionUUID, isLoadingUUID, publicKey, resetScantastic, expirationTimestamp, setExpirationTimestamp } =
    useScantasticContext()

  const scantasticValue = useMemo(() => {
    const parser = new UAParser(window.navigator.userAgent)
    const {
      device: { vendor, model },
      browser: { name: browser },
    } = parser.getResult()

    if (!publicKey || !sessionUUID) {
      return ''
    }

    try {
      const params = ScantasticParamsSchema.parse({
        uuid: sessionUUID,
        publicKey,
        vendor,
        browser,
        model,
      })
      return getScantasticUrl(params)
    } catch (e) {
      const wrappedError = new Error('Failed to build scantastic params', { cause: e })
      logger.error(wrappedError, {
        tags: {
          file: 'ScanToOnboard.tsx',
          function: 'useMemo',
        },
      })
      return ''
    }
  }, [publicKey, sessionUUID])

  const errorDerivingQR = Boolean(!isLoadingUUID && !scantasticValue)

  const checkOTPState = useCallback(async (): Promise<void> => {
    if (!sessionUUID) {
      return
    }
    try {
      // poll OTP state
      const response = await fetch(`${uniswapUrls.scantasticApiUrl}/otp-state/${sessionUUID}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to check OTP state: ${await response.text()}`)
      }
      const data = (await response.json()) as { otp: string; expiresAtInSeconds: number }
      const otpState = data.otp
      if (!otpState) {
        throw new Error(`Scantastic OTP check response did not include the requested OTP state`)
      }

      setExpirationTimestamp(data.expiresAtInSeconds * ONE_SECOND_MS)

      // mobile app has received the OTP and the user should input it into this UI
      if (otpState === 'ready') {
        goToNextStep()
      }
      if (otpState === 'expired') {
        resetScantastic()
      }
    } catch (e) {
      logger.error(e, {
        tags: {
          file: 'ScanToOnboard.tsx',
          function: 'checkOTPState',
        },
        extra: { uuid: sessionUUID },
      })
    }
  }, [sessionUUID, setExpirationTimestamp, goToNextStep, resetScantastic])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined

    if (isDocumentVisible) {
      interval = setInterval(checkOTPState, ONE_SECOND_MS)
    }

    return () => clearInterval(interval)
  }, [checkOTPState, isDocumentVisible])

  useTimeout(resetScantastic, expirationTimestamp - Date.now())

  const qrScale = useSharedValue(UNISWAP_LOGO_SCALE_DEFAULT)
  useEffect(() => {
    if (!isLoadingUUID) {
      qrScale.value = UNISWAP_LOGO_SCALE_DEFAULT
      return undefined
    }

    const springConfig: SpringConfig = {
      mass: 1,
      stiffness: 80,
      damping: 20,
    }
    qrScale.value = withRepeat(
      withSequence(
        withSpring(UNISWAP_LOGO_SCALE_LOADING, springConfig),
        withSpring(UNISWAP_LOGO_SCALE_DEFAULT, springConfig),
      ),
      0,
      true,
    )

    return () => cancelAnimation(qrScale)
  }, [isLoadingUUID])
  // Using useAnimatedStyle and AnimatedFlex because tamagui scale animation not working
  const qrAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: `scale(${qrScale.value})`,
    }
  }, [qrScale])

  /*
   * This needs to be memoized in order to avoid a rerender loop when navigating back to
   * this screen automatically on expiration or on HTTP error from within the Scantastic context.
   * This happens because of the way we animate these screens (see `OnboardingSteps.tsx`).
   * See WALL-6908 for original issue.
   */
  const onboardingScreen = useMemo(() => {
    return (
      <OnboardingScreen
        belowFrameContent={
          errorDerivingQR ? (
            <Flex centered width="100%">
              <TouchableArea
                borderRadius="$rounded20"
                zIndex={zIndexes.fixed}
                onPress={(): void => navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}`)}
              >
                <Flex
                  alignContent="center"
                  alignItems="center"
                  backgroundColor="$surface1"
                  borderColor="$surface3"
                  borderRadius="$roundedFull"
                  borderWidth="$spacing1"
                  my="$spacing12"
                  shadowColor="$shadowColor"
                  shadowOpacity={0.4}
                  shadowRadius="$spacing4"
                  pr="$spacing16"
                  pl="$spacing20"
                  py="$spacing12"
                >
                  <Flex row centered gap="$spacing8" justifyContent="space-between">
                    <FileListLock color="$accent1" size="$icon.36" />

                    <Flex shrink flexWrap="wrap">
                      <Text color="$neutral2" variant="body3">
                        {t('onboarding.scan.troubleScanning.title')}
                      </Text>
                      <Text color="$accent1" variant="buttonLabel2">
                        {t('onboarding.scan.troubleScanning.message')}
                      </Text>
                    </Flex>

                    <RotatableChevron
                      color="$neutral3"
                      direction="end"
                      height={iconSizes.icon24}
                      width={iconSizes.icon24}
                    />
                  </Flex>
                </Flex>
              </TouchableArea>
            </Flex>
          ) : undefined
        }
        Icon={
          <Square
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height={iconSizes.icon48}
            width={iconSizes.icon48}
          >
            <Mobile color="$neutral1" size="$icon.24" />
          </Square>
        }
        subtitle={t('onboarding.scan.subtitle')}
        title={t('onboarding.scan.title')}
        onBack={(): void => navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })}
      >
        <Flex alignItems="center" width="100%">
          <Flex
            alignContent="center"
            alignItems="center"
            backgroundColor={colors.white.val}
            borderColor="$surface3"
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            my="$spacing24"
            p="$spacing16"
            position="relative"
            shadowColor="$shadowColor"
            shadowOpacity={0.4}
            shadowRadius="$spacing4"
          >
            {errorDerivingQR ? (
              <Flex px="$spacing16" height={QR_CODE_SIZE} width={QR_CODE_SIZE}>
                <Text color="$neutral2" m="auto" textAlign="center" variant="body3">
                  {t('onboarding.scan.error')}
                </Text>
              </Flex>
            ) : (
              <>
                {/*
                NOTE: if you modify the style or colors of the QR code, make sure to thoroughly test
                how they perform when scanning them both on light and dark modes.
                */}
                <AnimatedFlex
                  alignItems="center"
                  backgroundColor={isLoadingUUID ? '$transparent' : '$surface1'}
                  borderRadius="$rounded12"
                  height={UNISWAP_LOGO_SIZE}
                  justifyContent="center"
                  position="absolute"
                  style={qrAnimatedStyle}
                  top={`calc(50% - ${UNISWAP_LOGO_SIZE / 2}px)`}
                  width={UNISWAP_LOGO_SIZE}
                  zIndex={zIndexes.default}
                >
                  <Image height={iconSizes.icon40} source={UNISWAP_LOGO} width={iconSizes.icon40} />
                </AnimatedFlex>
                {isLoadingUUID ? (
                  <Image height={QR_CODE_SIZE} source={DOT_GRID} width={QR_CODE_SIZE} />
                ) : (
                  <Flex
                    animateOnly={['opacity']}
                    animation="lazy"
                    enterStyle={{
                      opacity: 0,
                    }}
                  >
                    <QRCode
                      bgColor="transparent"
                      fgColor={colors.black.val}
                      size={QR_CODE_SIZE}
                      value={scantasticValue}
                    />
                  </Flex>
                )}
              </>
            )}
          </Flex>
          <Flex
            fill
            row
            alignItems="center"
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            gap="$spacing8"
            p="$spacing12"
            width="100%"
          >
            <Wifi size="$icon.20" />
            <Text color="$neutral2" variant="body4">
              {t('onboarding.scan.wifi')}
            </Text>
          </Flex>
        </Flex>
      </OnboardingScreen>
    )
  }, [colors.black.val, colors.white.val, errorDerivingQR, isLoadingUUID, qrAnimatedStyle, scantasticValue, t])

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Scantastic }}
      screen={ExtensionOnboardingScreens.OnboardingQRCode}
    >
      {onboardingScreen}
    </Trace>
  )
}
