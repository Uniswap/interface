import { useNavigate } from 'react-router-dom'
import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { Icons, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'

export const ONBOARDING_CONTENT_WIDTH = 450

type OnboardingScreenProps = {
  Icon?: JSX.Element
  title: string | JSX.Element
  subtitle: string
  warningSubtitle?: string
  onSubmit: () => void
  inputError?: string
  nextButtonEnabled: boolean
  nextButtonText: string
  children?: JSX.Element
}

export const OnboardingScreen = ({
  Icon,
  title,
  subtitle,
  warningSubtitle,
  onSubmit,
  inputError,
  nextButtonEnabled,
  nextButtonText = 'Next',
  children,
}: OnboardingScreenProps): JSX.Element => {
  const navigate = useNavigate()
  return (
    <Stack alignItems="center" gap="$spacing36" width={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing32">
        {Icon}
        <YStack alignItems="center" gap="$spacing12">
          <Text textAlign="center" variant="headlineMedium">
            {title}
          </Text>
          <YStack alignItems="center" gap="$spacing4">
            <Text color="$textSecondary" textAlign="center" variant="subheadSmall">
              {subtitle}
            </Text>
            {warningSubtitle && (
              <Text color="$accentCritical" textAlign="center" variant="bodySmall">
                {warningSubtitle}
              </Text>
            )}
          </YStack>
        </YStack>
      </YStack>
      <YStack alignItems="center" gap="$spacing8" width="100%">
        {children}
        {inputError && <OnboardingInputError error={inputError} />}
      </YStack>
      <XStack gap="$spacing12" width="100%">
        <Button
          backgroundColor="$background2"
          flexShrink={1}
          padding="$spacing16"
          onPress={(): void => navigate(-1)}>
          <Icons.BackArrow color="$textSecondary" size={iconSizes.icon24} />
        </Button>
        <Button
          backgroundColor={nextButtonEnabled ? '$magentaVibrant' : '$background3'}
          disabled={!nextButtonEnabled}
          flexGrow={1}
          theme="primary"
          onPress={onSubmit}>
          {/* TODO(EXT-207 / EXT-208): fix button component styling and derive text color from theme */}
          <Text color={nextButtonEnabled ? '$white' : '$textTertiary'} variant="buttonLabelMedium">
            {nextButtonText}
          </Text>
        </Button>
      </XStack>
    </Stack>
  )
}
