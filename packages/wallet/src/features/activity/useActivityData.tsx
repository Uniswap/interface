import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import { Flex, Icons, Loader, Text } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks'
import { LoadingItem, SectionHeader } from 'wallet/src/features/activity/utils'
import { AuthTrigger } from 'wallet/src/features/auth/types'
import TransactionSummaryLayout from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryLayout'
import { SwapSummaryCallbacks } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  ActivityItemRenderer,
  generateActivityItemRenderer,
} from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  useCreateSwapFormState,
  useMergeLocalAndRemoteTransactions,
} from 'wallet/src/features/transactions/hooks'
import { useMostRecentSwapTx } from 'wallet/src/features/transactions/swap/trade/legacy/hooks'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import { TransactionDetails } from 'wallet/src/features/transactions/types'
import { useHideSpamTokensSetting } from 'wallet/src/features/wallet/hooks'

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Flex pb="$spacing12">
    <Text color="$neutral2" variant="subheading2">
      {title}
    </Text>
  </Flex>
)

type ActivityDataProps = {
  owner: string
  authTrigger?: AuthTrigger
  isExternalProfile?: boolean
  emptyContainerStyle?: StyleProp<ViewStyle>
  onPressEmptyState?: () => void
}

type ActivityData = {
  maybeEmptyComponent: JSX.Element | null
  maybeLoaderComponent: JSX.Element | null
  renderActivityItem: ActivityItemRenderer
  sectionData: (TransactionDetails | SectionHeader | LoadingItem)[] | undefined
  keyExtractor: (item: TransactionDetails | SectionHeader | LoadingItem) => string
}

export function useActivityData({
  owner,
  authTrigger,
  isExternalProfile,
  emptyContainerStyle,
  onPressEmptyState,
}: ActivityDataProps): ActivityData {
  const { t } = useTranslation()
  const { navigateToSwapFlow } = useWalletNavigation()

  // Hide all spam transactions if active wallet has enabled setting.
  const hideSpamTokens = useHideSpamTokensSetting()

  const swapCallbacks: SwapSummaryCallbacks = useMemo(() => {
    return {
      useLatestSwapTransaction: useMostRecentSwapTx,
      useSwapFormTransactionState: useCreateSwapFormState,
      onRetryGenerator: (swapFormState: TransactionState | undefined): (() => void) => {
        if (!swapFormState) {
          return () => {}
        }
        return () => {
          navigateToSwapFlow({ initialState: swapFormState })
        }
      },
    }
  }, [navigateToSwapFlow])

  const renderActivityItem = useMemo(() => {
    return generateActivityItemRenderer(
      TransactionSummaryLayout,
      <Loader.Transaction />,
      SectionTitle,
      swapCallbacks,
      authTrigger
    )
  }, [swapCallbacks, authTrigger])

  const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } =
    useFormattedTransactionDataForActivity(
      owner,
      hideSpamTokens,
      useMergeLocalAndRemoteTransactions
    )

  const errorCard = (
    <Flex grow style={emptyContainerStyle}>
      <BaseCard.ErrorState
        retryButtonLabel={t('common.button.retry')}
        title={t('home.activity.error.load')}
        onRetry={onRetry}
      />
    </Flex>
  )

  const emptyListView = (
    <Flex grow style={emptyContainerStyle}>
      <BaseCard.EmptyState
        buttonLabel={isExternalProfile ? undefined : t('home.activity.empty.button')}
        description={
          isExternalProfile
            ? t('home.activity.empty.description.external')
            : t('home.activity.empty.description.default')
        }
        icon={<Icons.NoTransactions size="$icon.100" />}
        title={t('home.activity.empty.title')}
        onPress={onPressEmptyState}
      />
    </Flex>
  )

  const maybeEmptyComponent = hasData ? null : isError ? errorCard : emptyListView
  // We want to display the loading shimmer only on first load because items have their own loading shimmer
  const maybeLoaderComponent = isLoading && !hasData ? <Loader.Transaction repeat={6} /> : null

  return {
    maybeEmptyComponent,
    maybeLoaderComponent,
    renderActivityItem,
    sectionData,
    keyExtractor,
  }
}
