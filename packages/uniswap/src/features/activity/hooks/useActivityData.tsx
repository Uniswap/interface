import { PartialMessage } from '@bufbuild/protobuf'
import { FiatOnRampParams } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { Flex, Loader, Text } from 'ui/src'
import { NoTransactions } from 'ui/src/components/icons/NoTransactions'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import {
  ActivityItem,
  ActivityItemRenderer,
  generateActivityItemRenderer,
} from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { SwapSummaryCallbacks } from 'uniswap/src/components/activity/types'
import { useFormattedTransactionDataForActivity } from 'uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { isWeb } from 'utilities/src/platform'

export type UseActivityDataProps = {
  owner: Address
  ownerAddresses: Address[]
  swapCallbacks: SwapSummaryCallbacks
  fiatOnRampParams: PartialMessage<FiatOnRampParams> | undefined
  authTrigger?: AuthTrigger
  isExternalProfile?: boolean
  emptyComponentStyle?: StyleProp<ViewStyle>
  onPressEmptyState?: () => void
  skip?: boolean
}

export type ActivityRenderData = {
  maybeEmptyComponent: JSX.Element | null
  renderActivityItem: ActivityItemRenderer
  sectionData: ActivityItem[] | undefined
  keyExtractor: (item: ActivityItem) => string
}

export function useActivityData({
  owner,
  ownerAddresses,
  authTrigger,
  isExternalProfile,
  onPressEmptyState,
  swapCallbacks,
  fiatOnRampParams,
  skip,
}: UseActivityDataProps): ActivityRenderData {
  const { t } = useTranslation()

  // Hide all spam transactions if active wallet has enabled setting.
  const hideSpamTokens = useHideSpamTokensSetting()

  const renderActivityItem = useMemo(() => {
    return generateActivityItemRenderer({
      loadingItem: <Loader.Transaction />,
      sectionHeaderElement: SectionTitle,
      swapCallbacks,
      authTrigger,
    })
  }, [swapCallbacks, authTrigger])

  const { onRetry, isError, sectionData, keyExtractor } = useFormattedTransactionDataForActivity({
    address: owner,
    ownerAddresses,
    fiatOnRampParams,
    hideSpamTokens,
    skip,
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

const SectionTitle = ({ title, index }: { title: string; index?: number }): JSX.Element => (
  <Flex px={isWeb ? '$spacing8' : '$none'} py="$spacing8">
    <Text color="$neutral2" testID={`activity-list-item-${index}`} variant="subheading2">
      {title}
    </Text>
  </Flex>
)
