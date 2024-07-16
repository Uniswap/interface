import { useTranslation } from 'react-i18next'
import { Complete } from 'src/app/features/onboarding/Complete'
import { SyncFromPhoneButton } from 'src/app/features/onboarding/SyncFromPhoneButton'
import { Terms } from 'src/app/features/onboarding/Terms'
import { MainIntroWrapper } from 'src/app/features/onboarding/intro/MainIntroWrapper'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { useAppSelector } from 'src/store/store'
import { Button, Flex, Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useTimeout } from 'utilities/src/time/timing'

export function IntroScreen(): JSX.Element {
  const { t } = useTranslation()

  const isOnboarded = useAppSelector(isOnboardedSelector)

  // Detections for some unsupported browsers may not work until stylesheet is loaded
  useTimeout(() => {
    if (!checksIfSupportsSidePanel()) {
      navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.UnsupportedBrowser}`)
    }
  }, 0)

  if (isOnboarded) {
    return <Complete />
  }

  return (
    <Trace logImpression screen={ExtensionOnboardingScreens.Landing}>
      <Flex centered grow justifyContent="center">
        <MainIntroWrapper
          belowFrameContent={
            <Flex px={80}>
              <Terms />
            </Flex>
          }
        >
          <Flex gap="$spacing12" pb="$spacing16" pt="$spacing32">
            <Flex backgroundColor="$surface1" borderRadius="$rounded16">
              <Button
                flexGrow={1}
                theme="primary"
                onPress={(): void => navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}`)}
              >
                {t('onboarding.landing.button.create')}
              </Button>
            </Flex>
            <Button
              flexGrow={1}
              theme="secondary"
              onPress={(): void => navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}`)}
            >
              {t('onboarding.intro.button.alreadyHave')}
            </Button>
          </Flex>
          <Flex row alignItems="center" gap="$spacing16" py="$spacing4">
            <Flex fill backgroundColor="$surface3" height={1} />
            <Text color="$neutral3" variant="body3">
              {t('onboarding.intro.mobileScan.title')}
            </Text>
            <Flex fill backgroundColor="$surface3" height={1} />
          </Flex>
          <SyncFromPhoneButton fill />
        </MainIntroWrapper>
      </Flex>
    </Trace>
  )
}
