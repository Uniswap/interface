import { t } from 'i18next'
import { useCallback, useEffect } from 'react'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { useUnitagClaimContext } from 'src/app/features/unitags/UnitagClaimContext'
import { Flex, Square } from 'ui/src'
import { Person } from 'ui/src/components/icons'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionUnitagClaimScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { UnitagChooseProfilePicContent } from 'wallet/src/features/unitags/UnitagChooseProfilePicContent'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

const NFT_MODAL_MAX_WIDTH = 610

export function UnitagChooseProfilePicScreen(): JSX.Element {
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()
  const { unitag, entryPoint, setProfilePicUri } = useUnitagClaimContext()
  const address = useActiveAccountAddressWithThrow()

  const onNavigateContinue = useCallback(
    (imageUri: string | undefined) => {
      setProfilePicUri(imageUri)
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
            <Person color="$neutral1" size={iconSizes.icon24} />
          </Square>
        }
        title={t('unitags.onboarding.claim.title.choose')}
        subtitle={t('unitags.onboarding.claim.subtitle')}
        onBack={goToPreviousStep}
      >
        <Flex gap="$spacing24" pt="$spacing24" width="100%">
          <UnitagChooseProfilePicContent
            entryPoint={entryPoint}
            address={address}
            unitag={unitag ?? ''}
            shouldHandleClaim={false}
            unitagFontSize={fonts.heading3.fontSize}
            nftModalProps={{
              includeContextMenu: false,
              itemMargin: '$spacing6',
              containerProps: { m: -spacing.spacing6 }, // Cancels out the margin on each NFT item
              modalMaxWidth: NFT_MODAL_MAX_WIDTH,
              numColumns: 4,
            }}
            onContinue={onNavigateContinue}
          />
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
