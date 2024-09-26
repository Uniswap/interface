import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { useNavigationHeader } from 'src/utils/useNavigationHeader'
import { Person } from 'ui/src/components/icons'
import { Experiments, OnboardingRedesignRecoveryBackupProperties } from 'uniswap/src/features/gating/experiments'
import { getExperimentValue } from 'uniswap/src/features/gating/hooks'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import {
  MobileScreens,
  OnboardingScreens,
  SharedUnitagScreenParams,
  UnitagScreens,
  UnitagStackParamList,
} from 'uniswap/src/types/screens/mobile'
import {
  useCreateOnboardingAccountIfNone,
  useOnboardingContext,
} from 'wallet/src/features/onboarding/OnboardingContext'
import { ClaimUnitagContent } from 'wallet/src/features/unitags/ClaimUnitagContent'

type Props = NativeStackScreenProps<UnitagStackParamList, UnitagScreens.ClaimUnitag>

export function ClaimUnitagScreen({ navigation, route }: Props): JSX.Element {
  const { entryPoint, address } = route.params
  const { t } = useTranslation()

  useCreateOnboardingAccountIfNone()
  const { getOnboardingAccountAddress } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()

  const onNavigateContinue = (params: SharedUnitagScreenParams[UnitagScreens.ChooseProfilePicture]): void => {
    navigate(entryPoint === OnboardingScreens.Landing ? MobileScreens.OnboardingStack : MobileScreens.UnitagStack, {
      screen: UnitagScreens.ChooseProfilePicture,
      params,
    })
  }

  const onPressSkip = (): void => {
    const onboardingExperimentEnabled = getExperimentValue(
      Experiments.OnboardingRedesignRecoveryBackup,
      OnboardingRedesignRecoveryBackupProperties.Enabled,
      false,
    )

    sendAnalyticsEvent(UnitagEventName.UnitagOnboardingActionTaken, { action: 'later' })
    // Navigate to next screen if in onboarding
    navigate(MobileScreens.OnboardingStack, {
      screen: onboardingExperimentEnabled ? OnboardingScreens.Notifications : OnboardingScreens.WelcomeWallet,
      params: {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      },
    })
  }

  const showSkipButton = entryPoint === OnboardingScreens.Landing
  useNavigationHeader(navigation, showSkipButton ? onPressSkip : undefined)

  const title =
    entryPoint === MobileScreens.Home
      ? t('unitags.onboarding.claim.title.claim')
      : t('unitags.onboarding.claim.title.choose')

  return (
    <SafeKeyboardOnboardingScreen Icon={Person} subtitle={t('unitags.onboarding.claim.subtitle')} title={title}>
      <ClaimUnitagContent
        unitagAddress={address || onboardingAccountAddress}
        entryPoint={entryPoint}
        navigationEventConsumer={navigation}
        onNavigateContinue={onNavigateContinue}
      />
    </SafeKeyboardOnboardingScreen>
  )
}
