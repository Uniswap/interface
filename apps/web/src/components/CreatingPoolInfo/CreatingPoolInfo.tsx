import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { usePrevious } from 'utilities/src/react/hooks'

function CreatingPoolInfo() {
  const { t } = useTranslation()
  const { creatingPoolOrPair, poolOrPairLoading } = useCreateLiquidityContext()

  const previouslyCreatingPoolOrPair = usePrevious(creatingPoolOrPair)

  const shouldShowDisabled = previouslyCreatingPoolOrPair && poolOrPairLoading

  if (!shouldShowDisabled && !creatingPoolOrPair) {
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
      <InfoCircleFilled flexShrink={0} size="$icon.20" color="$neutral2" />
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
