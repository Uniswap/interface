import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Complete } from 'src/app/features/onboarding/Complete'
import { MainIntroWrapper } from 'src/app/features/onboarding/intro/MainIntroWrapper'
import { SyncFromPhoneButton } from 'src/app/features/onboarding/SyncFromPhoneButton'
import { Terms } from 'src/app/features/onboarding/Terms'
import { useIsExtensionPasskeyImportEnabled } from 'src/app/hooks/useIsExtensionPasskeyImportEnabled'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { checksIfSupportsSidePanel } from 'src/app/utils/chrome'
import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { Button, Flex, Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useTimeout } from 'utilities/src/time/timing'

export function IntroScreen(): JSX.Element {
  const { t } = useTranslation()
  const isPasskeyImportEnabled = useIsExtensionPasskeyImportEnabled()

  const isOnboarded = useSelector(isOnboardedSelector)
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
            <Flex row backgroundColor="$surface1" borderRadius="$rounded16">
              <Button
                variant="branded"
                onPress={(): void => navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}`)}
              >
                {isPasskeyImportEnabled
                  ? t('onboarding.landing.button.createAccount')
                  : t('onboarding.landing.button.create')}
              </Button>
            </Flex>
            <Flex row>
              <Button
                emphasis="secondary"
                onPress={(): void =>
                  navigate(
                    `/${TopLevelRoutes.Onboarding}/${isPasskeyImportEnabled ? OnboardingRoutes.SelectImportMethod : OnboardingRoutes.Import}`,
                  )
                }
              >
                {isPasskeyImportEnabled
                  ? t('onboarding.intro.button.logInOrImport')
                  : t('onboarding.intro.button.alreadyHave')}
              </Button>
            </Flex>
          </Flex>

          {isPasskeyImportEnabled ? null : (
            <>
              <Flex row alignItems="center" gap="$spacing16" py="$spacing4">
                <Flex fill backgroundColor="$surface3" height={1} />
                <Text color="$neutral3" variant="body3">
                  {t('onboarding.intro.mobileScan.title')}
                </Text>
                <Flex fill backgroundColor="$surface3" height={1} />
              </Flex>

              <SyncFromPhoneButton fill />
            </>
          )}
        </MainIntroWrapper>
      </Flex>
    </Trace>
  )
}
