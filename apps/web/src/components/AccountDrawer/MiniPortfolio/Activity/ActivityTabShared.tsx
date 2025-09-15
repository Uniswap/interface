import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { useUpdateAtom } from 'jotai/utils'
import { Flex, ScrollView } from 'ui/src'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'

export default function ActivityTabShared({ account }: { account: Address }) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)

  const { maybeEmptyComponent, renderActivityItem, sectionData } = useActivityData({
    owner: account,
    ownerAddresses: [account],
    swapCallbacks: {
      useLatestSwapTransaction: () => undefined,
      useSwapFormTransactionState: () => undefined,
      onRetryGenerator: () => () => {},
    },
    fiatOnRampParams: undefined,
    skip: false,
  })

  if (maybeEmptyComponent) {
    return maybeEmptyComponent
  }

  return (
    <Flex mx="$spacing8" gap="$none">
      <OpenLimitOrdersButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
      <ScrollView showsVerticalScrollIndicator={false} width="100%">
        {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
        {(sectionData ?? []).map((item: ActivityItem, index) => {
          return renderActivityItem({
            item,
            index,
          })
        })}
      </ScrollView>
    </Flex>
  )
}
