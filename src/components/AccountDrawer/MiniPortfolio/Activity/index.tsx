import { useAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import { LoadingBubble } from 'components/Tokens/loading'
import { PollingInterval } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme'

import { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { ActivityRow } from './ActivityRow'
import { useAllActivities } from './hooks'
import { createGroups } from './utils'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const lastFetchedAtom = atom<number | undefined>(0)

export function ActivityTab({ account }: { account: string }) {
  const [drawerOpen, toggleWalletDrawer] = useAccountDrawer()
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

  const activityGroups = useMemo(() => createGroups(activities), [activities])

  if (!activityGroups && loading) {
    return (
      <>
        <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
        <PortfolioSkeleton shrinkRight />
      </>
    )
  } else if (!activityGroups || activityGroups?.length === 0) {
    return <EmptyWalletModule type="activity" onNavigateClick={toggleWalletDrawer} />
  } else {
    return (
      <PortfolioTabWrapper>
        {activityGroups.map((activityGroup) => (
          <ActivityGroupWrapper key={activityGroup.title}>
            <ThemedText.SubHeader color="neutral2" marginLeft="16px">
              {activityGroup.title}
            </ThemedText.SubHeader>
            <Column data-testid="activity-content">
              {activityGroup.transactions.map((activity) => (
                <ActivityRow key={activity.hash} activity={activity} />
              ))}
            </Column>
          </ActivityGroupWrapper>
        ))}
      </PortfolioTabWrapper>
    )
  }
}
