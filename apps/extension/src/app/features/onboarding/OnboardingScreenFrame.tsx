import { useTranslation } from 'react-i18next'
import { OnboardingScreenProps } from 'src/app/features/onboarding/OnboardingScreenProps'
import { Button, Flex, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons'
import i18n from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function OnboardingScreenFrame({
  Icon,
  children,
  nextButtonEnabled,
  nextButtonIcon,
  nextButtonText = i18n.t('common.button.next'),
  nextButtonVariant = 'branded',
  nextButtonEmphasis = 'primary',
  onBack,
  onSubmit,
  onSkip,
  subtitle,
  title,
  warningSubtitle,
  endAdornment,
  noTopPadding,
}: Partial<OnboardingScreenProps>): JSX.Element {
  const { t } = useTranslation()

  if (!title) {
    return <>{children}</>
  }

  return (
    <>
      <Flex alignItems="center" gap="$spacing16" pt={noTopPadding ? undefined : '$spacing24'}>
        {onBack && (
          <TouchableArea
            hoverable
            borderRadius="$roundedFull"
            left="$none"
            p="$spacing4"
            position="absolute"
            top="$none"
            onPress={onBack}
          >
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
        )}
        {onSkip && (
          <TouchableArea
            hoverable
            borderRadius="$rounded8"
            position="absolute"
            px="$spacing8"
            py="$spacing4"
            right="$none"
            top="$none"
            testID={TestID.Skip}
            onPress={onSkip}
          >
            <Text color="$neutral2" variant="buttonLabel2">
              {t('common.button.skip')}
            </Text>
          </TouchableArea>
        )}
        {endAdornment && (
          <TouchableArea position="absolute" right="$none" top="$none">
            {endAdornment}
          </TouchableArea>
        )}
        {Icon}
        <Flex alignItems="center" gap="$spacing4" px="$spacing24">
          <Text textAlign="center" variant="subheading1">
            {title}
          </Text>
          <Flex alignItems="center" gap="$spacing4">
            <Text color="$neutral2" textAlign="center" variant="body3">
              {subtitle}
            </Text>
            {warningSubtitle && (
              <Text color="$statusCritical" textAlign="center" variant="body3">
                {warningSubtitle}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="center" width="100%">
        {children}
      </Flex>
      <Flex row gap="$spacing12" width="100%">
        {Boolean(onSubmit) && nextButtonText && (
          <Button
            isDisabled={!nextButtonEnabled}
            icon={nextButtonIcon}
            variant={nextButtonVariant}
            emphasis={nextButtonEmphasis}
            onPress={onSubmit}
          >
            {nextButtonText}
          </Button>
        )}
      </Flex>
    </>
  )
}
