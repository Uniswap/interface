import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer/DefaultMenu'
import { hideSpamAtom } from 'components/AccountDrawer/SpamToggle'
import Column from 'components/Column'
import { LoadingBubble } from 'components/Tokens/loading'
import { PollingInterval } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { useAccountDrawer } from '../hooks'
import { ActivityRow } from './ActivityRow'
import { useAllActivities } from './hooks'
import { createGroups } from './utils'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const lastFetchedAtom = atom<number | undefined>(0)

const OpenLimitOrdersActivityButton = styled(OpenLimitOrdersButton)`
  width: calc(100% - 32px);
  margin: 0 16px -4px;
`

export function ActivityTab({ account }: { account: string }) {
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)

  const [lastFetched, setLastFetched] = useAtom(lastFetchedAtom)
  const { activities, loading, refetch } = useAllActivities(account)

  // We only refetch remote activity if the user renavigates to the activity tab by changing tabs or opening the drawer
  useEffect(() => {
    const currentTime = Date.now()
    if (!lastFetched) {
      setLastFetched(currentTime)
    } else if (drawerOpen && lastFetched && currentTime - lastFetched > PollingInterval.Slow) {
      refetch()
      setLastFetched(currentTime)
    }
  }, [drawerOpen, lastFetched, refetch, setLastFetched])

  const hideSpam = useAtomValue(hideSpamAtom)
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
          <EmptyWalletModule type="activity" onNavigateClick={toggleWalletDrawer} />
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
                    !(hideSpam && activity.isSpam) && <ActivityRow key={activity.hash} activity={activity} />
                )}
              </Column>
            </ActivityGroupWrapper>
          ))}
        </PortfolioTabWrapper>
      </>
    )
  }
}
