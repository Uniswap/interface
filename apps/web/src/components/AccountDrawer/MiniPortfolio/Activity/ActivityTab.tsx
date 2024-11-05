import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer'
import { ActivityRow } from 'components/AccountDrawer/MiniPortfolio/Activity/ActivityRow'
import { useAllActivities } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { createGroups } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { PortfolioSkeleton, PortfolioTabWrapper } from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import { useUpdateAtom } from 'jotai/utils'
import styled from 'lib/styled-components'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useMemo } from 'react'
import { ThemedText } from 'theme/components'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const OpenLimitOrdersActivityButton = styled(OpenLimitOrdersButton)`
  width: calc(100% - 32px);
  margin: 0 16px -4px;
`

export function ActivityTab({ account }: { account: string }) {
  const accountDrawer = useAccountDrawer()
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)

  const { activities, loading } = useAllActivities(account)

  const hideSpam = useHideSpamTokensSetting()
  const activityGroups = useMemo(() => createGroups(activities, hideSpam), [activities, hideSpam])

  if (activityGroups.length === 0) {
    if (loading) {
      return (
        <>
          <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
          <PortfolioSkeleton shrinkRight />
        </>
      )
    } else {
      return (
        <>
          <OpenLimitOrdersActivityButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
          <EmptyWalletModule type="activity" onNavigateClick={accountDrawer.close} />
        </>
      )
    }
  } else {
    return (
      <>
        {/* OpenLimitOrdersActivityButton is rendered outside of the wrapper to avoid the flash on loading */}
        <OpenLimitOrdersActivityButton openLimitsMenu={() => setMenu(MenuState.LIMITS)} account={account} />
        <PortfolioTabWrapper>
          {activityGroups.map((activityGroup) => (
            <ActivityGroupWrapper key={activityGroup.title}>
              <ThemedText.SubHeader color="neutral2" marginLeft="16px">
                {activityGroup.title}
              </ThemedText.SubHeader>
              <Column data-testid="activity-content">
                {activityGroup.transactions.map(
                  (activity) =>
                    !(hideSpam && activity.isSpam) && <ActivityRow key={activity.hash} activity={activity} />,
                )}
              </Column>
            </ActivityGroupWrapper>
          ))}
        </PortfolioTabWrapper>
      </>
    )
  }
}
