import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import GraphCurve from 'src/assets/backgrounds/graph-curve.svg'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CHART_HEIGHT } from 'src/components/PriceChart/utils'
import { Text } from 'src/components/Text'

export function PriceChartError({
  onRetry,
}: Pick<ComponentProps<typeof BaseCard.ErrorState>, 'onRetry'>) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  return (
    <Flex gap="md" mx="lg">
      <Flex gap="sm">
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
        bg="background2"
        borderRadius="lg"
        height={CHART_HEIGHT}
        justifyContent="center"
        overflow="hidden">
        <Box alignItems="center" mt="xl" opacity={0.6} style={StyleSheet.absoluteFillObject}>
          <GraphCurve color={theme.colors.backgroundOutline} width="100%" />
        </Box>
        <BaseCard.ErrorState
          description={t('Something went wrong on our side.')}
          icon={
            <AlertTriangle
              color={theme.colors.textTertiary}
              height={55}
              strokeWidth={1}
              width={55}
            />
          }
          retryButtonLabel={t('Retry')}
          title={t("Couldn't load price chart")}
          onRetry={onRetry}
        />
      </Box>
    </Flex>
  )
}
