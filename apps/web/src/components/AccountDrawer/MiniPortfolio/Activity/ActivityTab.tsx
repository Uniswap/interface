import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { useMemo } from 'react'
import { Flex, ScrollView } from 'ui/src'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'

export default function ActivityTab({
  evmOwner,
  svmOwner,
}: {
  evmOwner: Address | undefined
  svmOwner: Address | undefined
}) {
  const setMenu = useSetMenu()

  const { maybeEmptyComponent, renderActivityItem, sectionData } = useActivityData({
    evmOwner,
    svmOwner,
    ownerAddresses: [evmOwner, svmOwner].filter(Boolean) as string[],
    swapCallbacks: {
      useLatestSwapTransaction: () => undefined,
      useSwapFormTransactionState: () => undefined,
      onRetryGenerator: () => () => {},
    },
    fiatOnRampParams: undefined,
    skip: false,
  })

  const ActivityItems = useMemo(() => {
    /* `sectionData` will be either an array of transactions or an array of loading skeletons */
    return sectionData?.map((item: ActivityItem, index) => {
      return renderActivityItem({
        item,
        index,
      })
    })
  }, [sectionData, renderActivityItem])

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <Flex mx="$spacing8" gap="$none">
      {evmOwner && (
        <OpenLimitOrdersButton
          openLimitsMenu={() => setMenu({ variant: MenuStateVariant.LIMITS })}
          account={evmOwner}
        />
      )}
      <ScrollView showsVerticalScrollIndicator={false} width="100%">
        {ActivityItems}
      </ScrollView>
    </Flex>
  )
}
