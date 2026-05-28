import { useTranslation } from 'react-i18next'
import { Flex, type FlexProps, Text } from 'ui/src'
import { PrivyLogo } from 'ui/src/components/logos/PrivyLogo'
import { ExternalLink } from '~/theme/components/Links'

export function PrivyWatermark(props: FlexProps) {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="center" justifyContent="center" gap="$spacing8" {...props}>
      <Text variant="body3" color="$neutral3">
        {t('onboarding.keyManagement.securedBy')}
      </Text>
      <ExternalLink href="https://www.privy.io/user-help-center" style={{ stroke: 'none' }}>
        <Flex height={14} overflow="hidden" justifyContent="center" mt="$spacing4">
          <PrivyLogo size={63} color="$neutral1" />
        </Flex>
      </ExternalLink>
    </Flex>
  )
}
