import { iconSizes } from 'ui/src/theme/iconSizes'
import { usePrevious } from 'utilities/src/react/hooks'

import { useCreatePositionContext } from 'pages/Pool/Positions/create/CreatePositionContext'

import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'

function CreatingPoolInfo() {
  const { t } = useTranslation()
  const { derivedPositionInfo } = useCreatePositionContext()

  const previouslyCreatingPoolOrPair = usePrevious(derivedPositionInfo.creatingPoolOrPair)

  const shouldShowDisabled = previouslyCreatingPoolOrPair && derivedPositionInfo.poolOrPairLoading

  if (!shouldShowDisabled && !derivedPositionInfo.creatingPoolOrPair) {
    return null
  }

  return (
    <Flex
      row
      gap="$spacing12"
      p="$spacing12"
      borderRadius="$rounded16"
      backgroundColor="$surface2"
      opacity={shouldShowDisabled ? 0.4 : 1}
    >
      <InfoCircleFilled flexShrink={0} size={iconSizes.icon20} color="$neutral2" />
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text variant="body3">{t('pool.create')}</Text>
        <Text variant="body3" color="$neutral2">
          {t('pool.create.info')}
        </Text>
      </Flex>
    </Flex>
  )
}

export default CreatingPoolInfo
