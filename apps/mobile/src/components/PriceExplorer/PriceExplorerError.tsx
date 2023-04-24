import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CHART_HEIGHT } from 'src/components/PriceExplorer/constants'
import { Text } from 'src/components/Text'

export function PriceExplorerError({
  showRetry,
  onRetry,
}: Pick<ComponentProps<typeof BaseCard.ErrorState>, 'onRetry'> & {
  showRetry: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="spacing16" mx="spacing24">
      <Flex gap="spacing12">
        <Text color="textTertiary" variant="headlineLarge">
          {
            // em dash
            '\u2013'
          }
        </Text>
        <Text color="textTertiary" variant="bodySmall">
          -
        </Text>
      </Flex>
      <Box
        alignItems="center"
        borderRadius="rounded16"
        height={CHART_HEIGHT}
        justifyContent="center"
        overflow="hidden">
        <BaseCard.ErrorState
          description={t('Something went wrong.')}
          retryButtonLabel={showRetry ? t('Retry') : undefined}
          title={t("Couldn't load price chart")}
          onRetry={onRetry}
        />
      </Box>
    </Flex>
  )
}
