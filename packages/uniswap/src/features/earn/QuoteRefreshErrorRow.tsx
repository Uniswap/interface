import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { invalidateEarnQuoteRefreshQueries } from 'uniswap/src/features/earn/quoteRefreshRetry'
import { useEvent } from 'utilities/src/react/hooks'

export function QuoteRefreshErrorRow(): JSX.Element {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const onPressRetry = useEvent((): void => {
    invalidateEarnQuoteRefreshQueries(queryClient).catch(() => undefined)
  })

  return (
    <Flex
      row
      shrink
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      gap="$spacing12"
      justifyContent="space-between"
      pl="$spacing12"
      pr="$spacing8"
      py="$spacing8"
    >
      <Flex fill>
        <Text color="$statusCritical" variant="body3">
          {t('swap.review.quoteRefreshError.title')}
        </Text>
        <Text color="$neutral2" variant="body4">
          {t('swap.review.quoteRefreshError.message')}
        </Text>
      </Flex>
      <Button px="$spacing8" width="auto" emphasis="secondary" size="small" flex={0} onPress={onPressRetry}>
        {t('common.button.retry')}
      </Button>
    </Flex>
  )
}
