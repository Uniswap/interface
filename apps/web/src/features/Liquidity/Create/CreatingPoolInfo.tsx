import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import type { IconProps } from 'ui/src'
import { Flex, Text } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { usePrevious } from 'utilities/src/react/hooks'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

function PoolInfoCallout({
  Icon,
  title,
  description,
}: {
  Icon: ComponentType<IconProps>
  title: string
  description: string
}) {
  return (
    <Flex row gap="$spacing12" p="$spacing12" borderRadius="$rounded16" backgroundColor="$surface2">
      <Icon flexShrink={0} size="$icon.20" color="$neutral2" />
      <Flex flexWrap="wrap" flexShrink={1} gap="$gap4">
        <Text variant="body3">{title}</Text>
        <Text variant="body3" color="$neutral2">
          {description}
        </Text>
      </Flex>
    </Flex>
  )
}

export function PoolAlreadyCreatedInfo() {
  const { t } = useTranslation()

  return (
    <PoolInfoCallout
      Icon={CheckCircleFilled}
      title={t('pool.alreadyCreated')}
      description={t('pool.alreadyCreated.info')}
    />
  )
}

export function CreatingPoolInfo() {
  const { t } = useTranslation()
  const { creatingPoolOrPair, poolOrPairLoading } = useCreateLiquidityContext()

  const previouslyCreatingPoolOrPair = usePrevious(creatingPoolOrPair)

  const shouldShowDisabled = previouslyCreatingPoolOrPair && poolOrPairLoading

  if (!shouldShowDisabled && !creatingPoolOrPair) {
    return null
  }

  return (
    <Flex opacity={shouldShowDisabled ? 0.4 : 1}>
      <PoolInfoCallout Icon={InfoCircleFilled} title={t('pool.create')} description={t('pool.create.info')} />
    </Flex>
  )
}
