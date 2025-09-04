import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { lazy, Suspense } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Loader } from 'ui/src'

const Pools = lazy(() => import('components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'))

export function UniExtensionPoolsMenu({ onClose, account }: { account: string; onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans i18nKey="common.pools" />} onClose={onClose}>
      <Flex height="100%">
        <Suspense fallback={<Loader.Box />}>
          <Pools account={account} />
        </Suspense>
      </Flex>
    </SlideOutMenu>
  )
}
