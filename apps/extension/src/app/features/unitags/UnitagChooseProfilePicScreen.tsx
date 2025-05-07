import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { useUnitagClaimContext } from 'src/app/features/unitags/UnitagClaimContext'
import { backgroundToSidePanelMessageChannel } from 'src/background/messagePassing/messageChannels'
import { BackgroundToSidePanelRequestType } from 'src/background/messagePassing/types/requests'
import { Flex, Square } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { fonts, iconSizes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionUnitagClaimScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { extensionNftModalProps } from 'wallet/src/features/unitags/ChooseNftModal'
import { UnitagChooseProfilePicContent } from 'wallet/src/features/unitags/UnitagChooseProfilePicContent'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

export function UnitagChooseProfilePicScreen(): JSX.Element {
  const { t } = useTranslation()
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { unitag, entryPoint, setProfilePicUri } = useUnitagClaimContext()
  const address = useAccountAddressFromUrlWithThrow()

  const onNavigateContinue = useCallback(
    async (imageUri: string | undefined) => {
      setProfilePicUri(imageUri)
      // TODO WALL-5067 move claim logic out of UnitagChooseProfilePicContent and integrate message sending
      await backgroundToSidePanelMessageChannel.sendMessage({
        type: BackgroundToSidePanelRequestType.RefreshUnitags,
      })
      goToNextStep()
    },
    [setProfilePicUri, goToNextStep],
  )

  useEffect(() => {
    if (!unitag) {
      logger.warn('UnitagChooseProfilePicScreen.tsx', 'render', 'unitag is empty when it should have a value')
    }
  }, [unitag])

  return (
    <Trace logImpression screen={ExtensionUnitagClaimScreens.CreateUsername}>
      <OnboardingScreen
        Icon={
          <Square
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height={iconSizes.icon48}
            width={iconSizes.icon48}
          >
            <Person color="$neutral1" size="$icon.24" />
          </Square>
        }
        title={t('unitags.onboarding.profile.title')}
        subtitle={t('unitags.onboarding.profile.subtitle')}
        onBack={goToPreviousStep}
      >
        <Flex gap="$spacing24" pt="$spacing24" width="100%">
          <UnitagChooseProfilePicContent
            shouldHandleClaim
            entryPoint={entryPoint}
            address={address}
            unitag={unitag ?? ''}
            unitagFontSize={fonts.heading3.fontSize}
            nftModalProps={extensionNftModalProps}
            onContinue={onNavigateContinue}
          />
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
