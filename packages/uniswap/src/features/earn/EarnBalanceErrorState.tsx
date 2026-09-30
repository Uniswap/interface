import { Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'

/**
 * Bordered, centered "balance failed to load" card with a retry action, shown when an earn balance
 * or position query fails. Shared across the earn vault modal/sheet and the mobile TDP earn section.
 */
export function EarnBalanceErrorState({ onRetry }: { onRetry: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="center"
      gap="$spacing12"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      px="$spacing16"
      py="$spacing24"
      testID={TestID.EarnBalanceError}
    >
      <AlertTriangleFilled color="$neutral3" size={iconSizes.icon24} />
      <Flex alignItems="center" gap="$spacing4">
        <Text variant="body3" color="$neutral2" textAlign="center">
          {t('portfolio.overview.earn.errorLoadingBalance')}
        </Text>
        <TouchableArea testID={TestID.EarnBalanceErrorRetry} onPress={onRetry}>
          <Text variant="buttonLabel3" color="$accent1">
            {t('common.button.tryAgain')}
          </Text>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
