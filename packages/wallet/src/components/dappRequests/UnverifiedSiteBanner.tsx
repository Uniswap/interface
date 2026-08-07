import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'

/**
 * Inline alert shown on approval requests from sites Blockaid returns as unverified.
 */
export function UnverifiedSiteBanner(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex borderColor="$surface3" borderWidth="$spacing1" borderRadius="$rounded16" p="$spacing16" gap="$spacing2">
      <Text color="$statusWarning" variant="buttonLabel3">
        {t('dapp.request.unverifiedSite.title')}
      </Text>
      <Text color="$neutral2" variant="body3">
        {t('dapp.request.unverifiedSite.description')}
      </Text>
    </Flex>
  )
}
