import { Button, ButtonEmphasis, ButtonVariant, Flex, Square, Text } from 'ui/src'

type SettingsRecoveryPhraseProps = {
  title: string
  subtitle: string
  icon: React.ReactNode
  nextButtonEnabled: boolean
  nextButtonText: string
  nextButtonVariant?: ButtonVariant
  nextButtonEmphasis?: ButtonEmphasis
  onNextPressed: () => void
  children: React.ReactNode
}

export function SettingsRecoveryPhrase({
  title,
  subtitle,
  icon,
  nextButtonEnabled,
  nextButtonText,
  nextButtonVariant,
  nextButtonEmphasis,
  onNextPressed,
  children,
}: SettingsRecoveryPhraseProps): JSX.Element {
  return (
    <Flex grow justifyContent="space-between" p="$spacing4" pt="$spacing24">
      <Flex alignItems="flex-start" gap="$spacing16">
        <Square backgroundColor="$statusCritical2" borderRadius="$rounded8" p="$spacing8">
          {icon}
        </Square>
        <Flex gap="$spacing4" mb="$spacing24">
          <Text color="$statusCritical" variant="subheading1">
            {title}
          </Text>
          <Text color="$neutral2" variant="body3">
            {subtitle}
          </Text>
        </Flex>
      </Flex>
      <Flex grow>{children}</Flex>
      <Flex row mt="$spacing12">
        <Button
          isDisabled={!nextButtonEnabled}
          flexGrow={1}
          variant={nextButtonVariant}
          emphasis={nextButtonEmphasis}
          onPress={onNextPressed}
        >
          {nextButtonText}
        </Button>
      </Flex>
    </Flex>
  )
}
