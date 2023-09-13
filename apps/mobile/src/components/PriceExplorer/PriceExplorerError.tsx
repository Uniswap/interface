import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CHART_HEIGHT } from 'src/components/PriceExplorer/constants'
import { Text } from 'src/components/Text'
import { Flex } from 'ui/src'

export function PriceExplorerError({
  showRetry,
  onRetry,
}: Pick<ComponentProps<typeof BaseCard.ErrorState>, 'onRetry'> & {
  showRetry: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing16" mx="$spacing24">
      <Flex gap="$spacing12">
        <Text color="neutral3" variant="headlineLarge">
          {
            '\u2013' // em dash
          }
        </Text>
      </Flex>
      <Flex
        alignItems="center"
        borderRadius="$rounded16"
        height={CHART_HEIGHT}
        justifyContent="center"
        overflow="hidden">
        <BaseCard.ErrorState
          description={t('Something went wrong.')}
          retryButtonLabel={showRetry ? t('Retry') : undefined}
          title={t('Couldn’t load price chart')}
          onRetry={onRetry}
        />
      </Flex>
    </Flex>
  )
}
