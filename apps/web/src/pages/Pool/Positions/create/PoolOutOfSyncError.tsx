import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'

export function PoolOutOfSyncError() {
  const { t } = useTranslation()

  const {
    derivedPositionInfo: { isPoolOutOfSync, refetchPoolData },
  } = useCreatePositionContext()

  if (!isPoolOutOfSync) {
    return null
  }

  return (
    <Flex row gap="$spacing12" backgroundColor="$surface2" borderRadius="$rounded16" p="$padding12">
      <Flex backgroundColor="$statusWarning2" p="$padding12" borderRadius="$rounded12" mb="auto">
        <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
      </Flex>
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text color="$statusWarning" variant="body3">
          {t('pool.liquidity.outOfSync')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {t('pool.liquidity.outOfSync.message')}
        </Text>
        <Text color="$neutral1" variant="buttonLabel4" onPress={refetchPoolData} {...ClickableTamaguiStyle}>
          {t('pool.refresh.prices')}
        </Text>
      </Flex>
    </Flex>
  )
}
