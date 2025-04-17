import { useTranslation } from 'react-i18next'
import { OptionCard } from 'src/app/components/buttons/OptionCard'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { IMPORT_PASSKEY_STATE_KEY } from 'src/app/features/onboarding/import/InitiatePasskeyAuth'
import { OnboardingRoutes, TopLevelRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { Flex, Square } from 'ui/src'
import { PapersText, Passkey, QrCode, WalletFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'

export function SelectImportMethod(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Import }}
      screen={ExtensionOnboardingScreens.SelectImportMethod}
    >
      <Flex gap="$spacing16">
        <OnboardingScreen
          Icon={
            <Square
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              height={iconSizes.icon48}
              width={iconSizes.icon48}
            >
              <WalletFilled color="$neutral1" size={iconSizes.icon24} />
            </Square>
          }
          title={t('onboarding.import.selectMethod.title')}
          onBack={(): void => navigate(`/${TopLevelRoutes.Onboarding}`, { replace: true })}
        >
          <Flex gap="$spacing16" mt="$spacing24" width="100%">
            <OptionCard
              Icon={Passkey}
              title={t('onboarding.import.selectMethod.passkey.title')}
              subtitle={t('onboarding.import.selectMethod.passkey.subtitle')}
              onPress={(): void =>
                navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.ImportPasskey}`, {
                  replace: true,
                  state: { [IMPORT_PASSKEY_STATE_KEY]: true },
                })
              }
            />

            <OptionCard
              Icon={PapersText}
              title={t('onboarding.import.selectMethod.recoveryPhrase.title')}
              subtitle={t('onboarding.import.selectMethod.recoveryPhrase.subtitle')}
              onPress={(): void =>
                navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Import}`, { replace: true })
              }
            />

            <OptionCard
              Icon={QrCode}
              title={t('onboarding.import.selectMethod.mobileApp.title')}
              subtitle={t('onboarding.import.selectMethod.mobileApp.subtitle')}
              onPress={(): void =>
                navigate(`/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Scan}`, { replace: true })
              }
            />
          </Flex>
        </OnboardingScreen>
      </Flex>
    </Trace>
  )
}
