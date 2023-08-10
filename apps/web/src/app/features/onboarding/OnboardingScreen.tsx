import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { Icons, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'

export const ONBOARDING_CONTENT_WIDTH = 450

type OnboardingScreenProps = {
  Icon?: JSX.Element
  children?: JSX.Element
  inputError?: string
  nextButtonEnabled: boolean
  nextButtonText: string
  onBack?: () => void
  onSubmit: () => void
  subtitle: string
  title: string | JSX.Element
  warningSubtitle?: string
}

export function OnboardingScreen({
  Icon,
  children,
  inputError,
  nextButtonEnabled,
  nextButtonText = 'Next',
  onBack,
  onSubmit,
  subtitle,
  title,
  warningSubtitle,
}: OnboardingScreenProps): JSX.Element {
  return (
    <Stack alignItems="center" gap="$spacing36" width={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing32">
        {Icon}
        <YStack alignItems="center" gap="$spacing12">
          <Text textAlign="center" variant="headlineMedium">
            {title}
          </Text>
          <YStack alignItems="center" gap="$spacing4">
            <Text color="$neutral2" textAlign="center" variant="subheadSmall">
              {subtitle}
            </Text>
            {warningSubtitle && (
              <Text color="$statusCritical" textAlign="center" variant="bodySmall">
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
        {onBack && (
          <Button
            backgroundColor="$surface2"
            borderColor="$surface3"
            flexShrink={1}
            padding="$spacing16"
            onPress={onBack}>
            <Icons.BackArrow color="$neutral2" size={iconSizes.icon24} />
          </Button>
        )}

        <Button disabled={!nextButtonEnabled} flexGrow={1} theme="primary" onPress={onSubmit}>
          {nextButtonText}
        </Button>
      </XStack>
    </Stack>
  )
}
