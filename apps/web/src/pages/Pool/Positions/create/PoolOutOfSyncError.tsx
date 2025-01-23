import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export function PoolOutOfSyncError() {
  const { t } = useTranslation()

  const {
    derivedPositionInfo: { isPoolOutOfSync },
  } = useCreatePositionContext()

  if (!isPoolOutOfSync) {
    return null
  }

  return (
    <Flex row gap="$spacing12" backgroundColor="$surface2" borderRadius="$rounded16" p="$padding12">
      <Flex backgroundColor="$statusCritical2" p="$padding12" borderRadius="$rounded12" mb="auto">
        <AlertTriangleFilled color="$statusCritical" size="$icon.20" />
      </Flex>
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text color="$statusCritical" variant="body3">
          {t('pool.liquidity.outOfSync')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('pool.liquidity.outOfSync.message')}
        </Text>
        <LearnMoreLink
          url={uniswapUrls.helpArticleUrls.poolOutOfSync}
          textVariant="buttonLabel4"
          textColor="$neutral1"
        />
      </Flex>
    </Flex>
  )
}
