import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useChartDimensions } from 'src/components/PriceExplorer/useChartDimensions'
import { Flex, Text } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'

export function PriceExplorerError({
  showRetry,
  onRetry,
}: Pick<ComponentProps<typeof BaseCard.ErrorState>, 'onRetry'> & {
  showRetry: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { chartHeight } = useChartDimensions()

  return (
    <Flex gap="$spacing16" mx="$spacing24">
      <Flex gap="$spacing12">
        <Text color="$neutral3" variant="heading1">
          {
            '\u2013' // em dash
          }
        </Text>
      </Flex>
      <Flex
        alignItems="center"
        borderRadius="$rounded16"
        height={chartHeight}
        justifyContent="center"
        overflow="hidden">
        <BaseCard.ErrorState
          description={t('token.priceExplorer.error.description')}
          retryButtonLabel={showRetry ? t('common.button.retry') : undefined}
          title={t('token.priceExplorer.error.title')}
          onRetry={onRetry}
        />
      </Flex>
    </Flex>
  )
}
