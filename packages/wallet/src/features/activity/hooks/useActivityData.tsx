import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { Flex, Loader, Text, isWeb } from 'ui/src'
import { NoTransactions } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks/useFormattedTransactionDataForActivity'
import { LoadingItem, SectionHeader } from 'wallet/src/features/activity/utils'
import { SwapSummaryCallbacks } from 'wallet/src/features/transactions/SummaryCards/types'
import { ActivityItemRenderer, generateActivityItemRenderer } from 'wallet/src/features/transactions/SummaryCards/utils'
import { useCreateSwapFormState } from 'wallet/src/features/transactions/hooks'
import { useMostRecentSwapTx } from 'wallet/src/features/transactions/swap/hooks/useMostRecentSwapTx'

const SectionTitle = ({ title, index }: { title: string; index?: number }): JSX.Element => (
  <Flex px={isWeb ? '$spacing8' : '$none'} py="$spacing8">
    <Text color="$neutral2" testID={`activity-list-item-${index}`} variant="subheading2">
      {title}
    </Text>
  </Flex>
)

type ActivityDataProps = {
  owner: string
  authTrigger?: AuthTrigger
  isExternalProfile?: boolean
  emptyComponentStyle?: StyleProp<ViewStyle>
  onPressEmptyState?: () => void
}

type ActivityData = {
  maybeEmptyComponent: JSX.Element | null
  renderActivityItem: ActivityItemRenderer
  sectionData: (TransactionDetails | SectionHeader | LoadingItem)[] | undefined
  keyExtractor: (item: TransactionDetails | SectionHeader | LoadingItem) => string
}

export function useActivityData({
  owner,
  authTrigger,
  isExternalProfile,
  onPressEmptyState,
}: ActivityDataProps): ActivityData {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useWalletNavigation()

  // Hide all spam transactions if active wallet has enabled setting.
  const hideSpamTokens = useHideSpamTokensSetting()

  const onRetryGenerator = useCallback(
    (swapFormState: TransactionState | undefined): (() => void) => {
      if (!swapFormState) {
        return () => {}
      }
      return () => {
        navigateToSwapFlow({ initialState: swapFormState })
      }
    },
    [navigateToSwapFlow],
  )

  const swapCallbacks: SwapSummaryCallbacks = useMemo(() => {
    return {
      useLatestSwapTransaction: useMostRecentSwapTx,
      useSwapFormTransactionState: useCreateSwapFormState,
      onRetryGenerator,
    }
  }, [onRetryGenerator])

  const renderActivityItem = useMemo(() => {
    return generateActivityItemRenderer(<Loader.Transaction />, SectionTitle, swapCallbacks, authTrigger)
  }, [swapCallbacks, authTrigger])

  const { onRetry, isError, sectionData, keyExtractor } = useFormattedTransactionDataForActivity({
    address: owner,
    hideSpamTokens,
  })

  const errorCard = useMemo(
    () => (
      <Flex grow>
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('home.activity.error.load')}
          onRetry={onRetry}
        />
      </Flex>
    ),
    [onRetry, t],
  )

  const emptyListView = useMemo(
    () => (
      <Flex centered pt="$spacing48" px="$spacing36">
        <BaseCard.EmptyState
          buttonLabel={isExternalProfile || !onPressEmptyState ? undefined : t('home.activity.empty.button')}
          description={
            isExternalProfile
              ? t('home.activity.empty.description.external')
              : t('home.activity.empty.description.default')
          }
          icon={<NoTransactions color="$neutral3" size="$icon.100" />}
          title={t('home.activity.empty.title')}
          onPress={onPressEmptyState}
        />
      </Flex>
    ),
    [isExternalProfile, onPressEmptyState, t],
  )

  // We check `sectionData` instead of `hasData` because `sectionData` has either transactions or a loading skeleton.
  const maybeEmptyComponent = sectionData?.length ? null : isError ? errorCard : emptyListView

  return {
    maybeEmptyComponent,
    renderActivityItem,
    sectionData,
    keyExtractor,
  }
}
