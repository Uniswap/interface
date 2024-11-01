import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingStepsContext'
import { useUnitagClaimContext } from 'src/app/features/unitags/UnitagClaimContext'
import { closeCurrentTab } from 'src/app/navigation/utils'
import { Button, Flex, Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { UnitagWithProfilePicture } from 'wallet/src/features/unitags/UnitagWithProfilePicture'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { useAccountAddressFromUrlWithThrow } from 'wallet/src/features/wallet/hooks'

export function UnitagConfirmationScreen(): JSX.Element {
  const { t } = useTranslation()

  const address = useAccountAddressFromUrlWithThrow()
  const { unitag, profilePicUri } = useUnitagClaimContext()
  const { goToNextStep } = useOnboardingSteps()

  const onPressCustomize = (): void => {
    // Assumes edit profile screen is next step. Uses onboarding steps for consistent nav animation
    goToNextStep()
  }

  useEffect(() => {
    if (!unitag) {
      logger.warn('UnitagConfirmationScreen.tsx', 'render', 'unitag is empty when it should have a value')
    }
  }, [unitag])

  if (!unitag) {
    return <></>
  }

  return (
    <OnboardingScreen>
      <Flex grow gap="$spacing12" pt="$spacing24">
        <Flex centered py="$spacing12">
          <UnitagWithProfilePicture address={address} profilePictureUri={profilePicUri} unitag={unitag} />
        </Flex>
        <Flex centered gap="$spacing12">
          <Text color="$neutral1" textAlign="center" variant="heading3">
            {t('unitags.claim.confirmation.success.long')}
          </Text>
          <Text color="$neutral2" textAlign="center" variant="subheading2">
            {t('unitags.claim.confirmation.description', {
              unitagAddress: `${unitag}${UNITAG_SUFFIX}`,
            })}
          </Text>
        </Flex>
        <Flex gap="$spacing12" pt="$spacing12">
          <Button size="medium" theme="primary" onPress={closeCurrentTab}>
            {t('common.button.done')}
          </Button>
          <Button size="medium" theme="secondary" onPress={onPressCustomize}>
            {t('unitags.claim.confirmation.customize')}
          </Button>
        </Flex>
      </Flex>
    </OnboardingScreen>
  )
}
