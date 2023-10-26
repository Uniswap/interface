import { useAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import { LoadingBubble } from 'components/Tokens/loading'
import { PollingInterval } from 'graphql/data/util'
import { atom, useAtom } from 'jotai'
import { UniswapXOrderStatus } from 'lib/hooks/orders/types'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useEffect } from 'react'
import styled from 'styled-components'

import { ActivityRow } from '../Activity/ActivityRow'
import { useAllActivities } from '../Activity/hooks'
import { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

const lastFetchedAtom = atom<number | undefined>(0)

// eslint-disable-next-line import/no-unused-modules
export default function ActivityTab({ account }: { account: string }) {
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

  const openOrders = activities?.filter((activity) => activity.offchainOrderStatus === UniswapXOrderStatus.OPEN)

  if (!openOrders && loading) {
    return (
      <>
        <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
        <PortfolioSkeleton shrinkRight />
      </>
    )
  } else if (!openOrders || openOrders?.length === 0) {
    return <EmptyWalletModule type="activity" onNavigateClick={toggleWalletDrawer} />
  } else {
    return (
      <PortfolioTabWrapper>
        <Column data-testid="activity-content">
          {openOrders.map((activity) => (
            <ActivityRow key={activity.hash} activity={activity} />
          ))}
        </Column>
      </PortfolioTabWrapper>
    )
  }
}
