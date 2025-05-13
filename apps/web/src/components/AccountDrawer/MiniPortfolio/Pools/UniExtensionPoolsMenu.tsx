import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import Column from 'components/deprecated/Column'
import styled from 'lib/styled-components'
import { Suspense, lazy } from 'react'
import { Trans } from 'react-i18next'
import { Loader } from 'ui/src/loading/Loader'

const Pools = lazy(() => import('components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'))

const Container = styled(Column)`
  height: 100%;
  position: relative;
`

export function UniExtensionPoolsMenu({ onClose, account }: { account: string; onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans i18nKey="common.pools" />} onClose={onClose}>
      <Container>
        <Suspense fallback={<Loader.Box />}>
          <Pools account={account} />
        </Suspense>
      </Container>
    </SlideOutMenu>
  )
}
