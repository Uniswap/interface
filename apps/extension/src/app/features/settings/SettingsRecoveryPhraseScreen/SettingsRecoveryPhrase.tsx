import { DeprecatedButton, Flex, Square, Text } from 'ui/src'
import { ThemeNames } from 'ui/src/theme'

export type SettingsRecoveryPhraseProps = {
  title: string
  subtitle: string
  icon: React.ReactNode
  nextButtonEnabled: boolean
  nextButtonText: string
  nextButtonTheme: string
  onNextPressed: () => void
  children: React.ReactNode
}
export function SettingsRecoveryPhrase({
  title,
  subtitle,
  icon,
  nextButtonEnabled,
  nextButtonText,
  nextButtonTheme,
  onNextPressed,
  children,
}: SettingsRecoveryPhraseProps): JSX.Element {
  return (
    <Flex grow justifyContent="space-between" p="$spacing4" pt="$spacing24">
      <Flex alignItems="flex-start" gap="$spacing16">
        <Square backgroundColor="$DEP_accentCriticalSoft" borderRadius="$rounded8" p="$spacing8">
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
      <Flex mt="$spacing12">
        <DeprecatedButton
          isDisabled={!nextButtonEnabled}
          flexGrow={1}
          theme={nextButtonTheme as ThemeNames}
          onPress={onNextPressed}
        >
          {nextButtonText}
        </DeprecatedButton>
      </Flex>
    </Flex>
  )
}
