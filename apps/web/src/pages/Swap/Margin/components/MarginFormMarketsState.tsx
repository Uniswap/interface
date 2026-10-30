import { Flex, Skeleton, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'

const SKELETON_ROW_COUNT = 3

// Precedence: loading → error → empty. Callers gate this on an already-unresolved market, so a
// `skipToken`'d query would read here as "confirmed empty" rather than "not yet asked" — inert today
// since useMarginMarkets always passes a constant params object, but a trap if it's ever parametrized.
export function MarginFormMarketsState({
  isLoading,
  error,
  onRetry,
}: {
  isLoading: boolean
  error: unknown
  onRetry: () => void
}): JSX.Element {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Flex gap="$spacing8" testID={TestID.MarginMarketsLoading}>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
          <Skeleton key={i}>
            <Flex width="100%" height={48} borderRadius="$rounded16" backgroundColor="$neutral3" />
          </Skeleton>
        ))}
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex gap="$spacing8" p="$spacing12" alignItems="center" testID={TestID.MarginMarketsError}>
        <Text variant="body3" color="$neutral2">
          {t('margin.market.error')}
        </Text>
        <Flex row>
          <Button size="small" variant="branded" emphasis="secondary" onPress={onRetry}>
            {t('common.button.retry')}
          </Button>
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex p="$spacing12" alignItems="center" testID={TestID.MarginMarketsEmpty}>
      <Text variant="body3" color="$neutral2">
        {t('margin.market.empty')}
      </Text>
    </Flex>
  )
}
