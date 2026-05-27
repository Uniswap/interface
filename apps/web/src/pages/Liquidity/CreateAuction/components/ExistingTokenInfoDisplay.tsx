import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { stripTrailingSlashesFromWebsiteUrl } from '~/pages/Liquidity/CreateAuction/websiteLink'

export function ExistingTokenInfoDisplay({
  description,
  websiteLink,
  xHandle,
}: {
  description: string
  websiteLink: string
  xHandle: string
}): JSX.Element | null {
  const { t } = useTranslation()

  if (!description && !websiteLink && !xHandle) {
    return null
  }

  return (
    <Flex gap="$spacing8">
      {description ? (
        <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing2">
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.tokenInfo.descriptionField')}
          </Text>
          <Text variant="body1" color="$neutral1">
            {description}
          </Text>
        </Flex>
      ) : null}
      {websiteLink ? (
        <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing12">
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.tokenInfo.websiteLink')}
          </Text>
          <Text variant="body1" color="$neutral1">
            {stripTrailingSlashesFromWebsiteUrl(websiteLink)}
          </Text>
        </Flex>
      ) : null}
      {xHandle ? (
        <Flex backgroundColor="$surface2" borderRadius="$rounded20" p="$spacing16" gap="$spacing12">
          <Text variant="body3" color="$neutral2">
            {t('toucan.createAuction.step.tokenInfo.xProfile')}
          </Text>
          <Flex row alignItems="center" gap="$spacing8">
            <XTwitter color="$neutral1" size="$icon.20" />
            <Text variant="body1" color="$neutral1">
              @{xHandle}
            </Text>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}
