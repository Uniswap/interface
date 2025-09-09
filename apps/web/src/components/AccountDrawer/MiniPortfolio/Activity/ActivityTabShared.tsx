import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/constants'
import { useUpdateAtom } from 'jotai/utils'
import { Flex, ScrollView } from 'ui/src'
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
    <Flex mx="$spacing12">
      <Flex mt="$spacing16">
        {/* OpenLimitOrdersActivityButton is rendered outside of the wrapper to avoid the flash on loading */}
        <OpenLimitOrdersButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
      </Flex>
      <ScrollView showsVerticalScrollIndicator={false} width="100%">
        {/* `sectionData` will be either an array of transactions or an array of loading skeletons */}
        {(sectionData ?? []).map((item, index) => renderActivityItem({ item, index }))}
      </ScrollView>
    </Flex>
  )
}
