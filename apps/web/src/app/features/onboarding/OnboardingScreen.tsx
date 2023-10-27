import { InputError } from 'src/app/components/InputError'
import { Button, Flex, Icons, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'

export const ONBOARDING_CONTENT_WIDTH = 550

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
    <Flex
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded32"
      borderWidth="$spacing1"
      gap="$spacing24"
      paddingHorizontal="$spacing48"
      paddingVertical="$spacing60"
      shadowColor="$surface3"
      shadowRadius={10}
      width={ONBOARDING_CONTENT_WIDTH}>
      <Flex alignItems="center" gap="$spacing32">
        {Icon}
        <Flex alignItems="center" gap="$spacing12">
          <Text textAlign="center" variant="heading2">
            {title}
          </Text>
          <Flex alignItems="center" gap="$spacing4">
            <Text color="$neutral2" textAlign="center" variant="subheading2">
              {subtitle}
            </Text>
            {warningSubtitle && (
              <Text color="$statusCritical" textAlign="center" variant="body2">
                {warningSubtitle}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="center" gap="$spacing16" width="100%">
        {children}
        <InputError error={inputError} />
      </Flex>
      <Flex row gap="$spacing12" width="100%">
        {onBack && (
          <Button
            backgroundColor="$surface2"
            borderColor="$surface3"
            flexShrink={1}
            p="$spacing16"
            onPress={onBack}>
            <Icons.BackArrow color="$neutral2" size={iconSizes.icon24} />
          </Button>
        )}

        <Button disabled={!nextButtonEnabled} flexGrow={1} theme="primary" onPress={onSubmit}>
          {nextButtonText}
        </Button>
      </Flex>
    </Flex>
  )
}
