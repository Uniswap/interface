import React, { ComponentProps, ReactNode, useCallback, useContext, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { OnboardingStackBaseParams, useOnboardingStackNavigation } from 'src/app/navigation/types'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { CarouselContext } from 'src/components/carousel/Carousel'
import { Flex, Text } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { getCloudProviderName } from 'uniswap/src/utils/cloud-backup/getCloudProviderName'

function Page({ text, params }: { text: ReactNode; params: OnboardingStackBaseParams }): JSX.Element {
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const { goToPrev, goToNext } = useContext(CarouselContext)
  const navigation = useOnboardingStackNavigation()

  const onDismiss = useCallback((): void => {
    navigation.navigate(OnboardingScreens.Backup, params)
  }, [navigation, params])

  const slideChangeGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(({ absoluteX }) => {
        if (absoluteX < fullWidth * 0.33) {
          runOnJS(goToPrev)()
        } else {
          runOnJS(goToNext)()
        }
      }),
    [goToPrev, goToNext, fullWidth],
  )

  const dismissGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        runOnJS(onDismiss)()
      }),
    [onDismiss],
  )

  return (
    <Flex fill>
      <GestureDetector gesture={slideChangeGesture}>
        <Flex centered gap="$spacing16">
          <Flex row alignItems="center" justifyContent="space-between" px="$spacing24" width={fullWidth}>
            <Text color="$neutral2" variant="subheading2">
              {t('onboarding.tooltip.recoveryPhrase.trigger')}
            </Text>
            <GestureDetector gesture={dismissGesture}>
              <CloseButton color="$neutral2" onPress={(): void => undefined} />
            </GestureDetector>
          </Flex>
          <Flex flex={0.2} />
          <Flex flex={0.8} px="$spacing24">
            <CustomHeadingText>{text}</CustomHeadingText>
          </Flex>
        </Flex>
      </GestureDetector>
    </Flex>
  )
}

export const SeedPhraseEducationContent = (params: OnboardingStackBaseParams): JSX.Element[] => {
  const cloudProviderName = getCloudProviderName()
  const highlightComponent = <CustomHeadingText color="$accent1" />

  const pageContentList = [
    // biome-ignore-start lint/correctness/useJsxKeyInIterable: Static array items don't need keys
    <Trans components={{ highlight: highlightComponent }} i18nKey="account.recoveryPhrase.education.part1" />,
    <Trans components={{ highlight: highlightComponent }} i18nKey="account.recoveryPhrase.education.part2" />,
    <Trans components={{ highlight: highlightComponent }} i18nKey="account.recoveryPhrase.education.part3" />,
    <Trans
      components={{ highlight: highlightComponent }}
      i18nKey="account.recoveryPhrase.education.part4"
      values={{ cloudProviderName }}
    />,
    <Trans components={{ highlight: highlightComponent }} i18nKey="account.recoveryPhrase.education.part5" />,
    <Trans components={{ highlight: highlightComponent }} i18nKey="account.recoveryPhrase.education.part6" />,
    // biome-ignore-end lint/correctness/useJsxKeyInIterable: Static array items don't need keys
  ]

  return pageContentList.map((content, i) => (
    <Page key={i} params={params} text={<CustomHeadingText>{content}</CustomHeadingText>} />
  ))
}

function CustomHeadingText(props: ComponentProps<typeof Text>): JSX.Element {
  return <Text fontSize={28} lineHeight={34} variant="heading2" {...props} />
}
