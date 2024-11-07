import React from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackScreenProp } from 'src/app/navigation/types'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Flex } from 'ui/src'
import { Photo } from 'ui/src/components/icons'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { UnitagChooseProfilePicContent } from 'wallet/src/features/unitags/UnitagChooseProfilePicContent'

export function UnitagChooseProfilePicScreen({
  navigation,
  route,
}: UnitagStackScreenProp<UnitagScreens.ChooseProfilePicture>): JSX.Element {
  const { entryPoint, unitag, unitagFontSize, address } = route.params

  const { t } = useTranslation()
  const { addUnitagClaim } = useOnboardingContext()

  const handleContinue = async (imageUri: string | undefined): Promise<void> => {
    if (entryPoint === OnboardingScreens.Landing) {
      addUnitagClaim({ address, username: unitag, avatarUri: imageUri })

      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.Notifications,
        params: {
          importType: ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        },
      })
    } else {
      navigate(MobileScreens.UnitagStack, {
        screen: UnitagScreens.UnitagConfirmation,
        params: {
          unitag,
          address,
          profilePictureUri: imageUri,
        },
      })
    }
  }

  const onPressSkip = (): void => {
    sendAnalyticsEvent(UnitagEventName.UnitagOnboardingActionTaken, { action: 'later' })

    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.Notifications,
      params: {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      },
    })
  }

  const showSkipButton = entryPoint === OnboardingScreens.Landing
  useNavigationHeader(navigation, showSkipButton ? onPressSkip : undefined)

  return (
    <SafeKeyboardOnboardingScreen
      Icon={Photo}
      subtitle={t('unitags.onboarding.profile.subtitle')}
      title={t('unitags.onboarding.profile.title')}
    >
      <Flex fill pt="$spacing24" gap="$spacing16">
        <UnitagChooseProfilePicContent
          address={address}
          unitag={unitag}
          shouldHandleClaim={entryPoint !== OnboardingScreens.Landing}
          entryPoint={entryPoint}
          unitagFontSize={unitagFontSize}
          onContinue={handleContinue}
        />
      </Flex>
    </SafeKeyboardOnboardingScreen>
  )
}
