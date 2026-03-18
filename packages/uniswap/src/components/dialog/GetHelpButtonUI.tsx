import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps } from 'ui/src'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { Text } from 'ui/src/components/text/Text'

/**
 * Shared UI for the GetHelpButton used by both web and native implementations.
 * Accepts platform-specific props for styling and behavior.
 */
export function GetHelpButtonUI({ children, ...flexProps }: FlexProps & { children?: ReactNode }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      borderRadius="$rounded12"
      px="$spacing8"
      py="$spacing6"
      gap="$spacing4"
      alignItems="center"
      borderWidth="$spacing1"
      borderColor="$surface3"
      {...flexProps}
    >
      <EnvelopeHeart color="$neutral1" size="$icon.16" />
      <Text variant="buttonLabel4" color="$neutral1">
        {t('common.getHelp.button')}
      </Text>
      {children}
    </Flex>
  )
}
