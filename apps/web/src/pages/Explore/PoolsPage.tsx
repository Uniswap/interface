import { isEVMChain } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useFilteredChainIds } from '~/components/NetworkFilter/useFilteredChains'
import { PoolNotFoundModal } from '~/components/NotFoundModal/PoolNotFoundModal'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { usePoolAreaNavigation } from '~/features/Explore/poolArea/hooks/usePoolAreaNavigation'
import { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { PoolAreaHeroHeader } from '~/features/Liquidity/PoolAreaHeroHeader'
import { PoolAreaLayout } from '~/features/Liquidity/PoolAreaLayout'
import { PoolAreaTabs } from '~/features/Liquidity/PoolAreaTabs'
import { ExplorePoolsTab } from '~/pages/Explore/categories/ExplorePoolsTab'
import { EXPLORE_TOKEN_SECTION_ID } from '~/pages/Explore/categories/useExploreCategory'
import { ExploreTableFilters } from '~/pages/Explore/ExploreTableFilters'
import { useExploreHeartbeatCoordinator } from '~/pages/Explore/hooks/useExploreHeartbeatCoordinator'
import {
  NOT_FOUND_RESULT_PARAM,
  NOT_FOUND_TYPE_PARAM,
  useExploreNotFoundModal,
} from '~/pages/Explore/useExploreNotFoundModal'
import { ExploreTab } from '~/types/explore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export default function PoolsPage(): JSX.Element {
  const chainId = useChainIdFromUrlParam()
  const filteredChainIds = useFilteredChainIds(undefined, { singleModeNetworks: true })
  const tabSupportedNetworks = useMemo(() => filteredChainIds.filter(isEVMChain), [filteredChainIds])
  const { isPoolNotFoundOpen, closeNotFoundModal } = useExploreNotFoundModal()
  const urls = usePoolAreaNavigation({
    omitSearchParams: isPoolNotFoundOpen ? [NOT_FOUND_RESULT_PARAM, NOT_FOUND_TYPE_PARAM] : undefined,
  })

  useExploreHeartbeatCoordinator({ tab: ExploreTab.Pools, enabled: true })

  return (
    <Trace
      logImpression
      page={InterfacePageName.ExplorePage}
      properties={{
        chainName: chainId === undefined ? undefined : getChainInfo(chainId).urlParam,
        tab: ExploreTab.Pools,
      }}
    >
      <PoolAreaHeroHeader />
      <PoolAreaLayout gap="$spacing24" py="$spacing24" $md={{ px: '$none' }}>
        <Flex
          id={EXPLORE_TOKEN_SECTION_ID}
          width="100%"
          maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
          mx="auto"
          gap="$spacing24"
        >
          <PoolAreaTabs activeTab={PoolAreaTab.Pools} urls={urls} replace={isPoolNotFoundOpen} />
          <Flex row width="100%" alignItems="center">
            <ExploreTableFilters
              currentKey={ExploreTab.Pools}
              tabSupportedNetworks={tabSupportedNetworks}
              layout="poolArea"
            />
          </Flex>
        </Flex>
        <ExplorePoolsTab />
      </PoolAreaLayout>
      <PoolNotFoundModal isOpen={isPoolNotFoundOpen} closeModal={closeNotFoundModal} />
    </Trace>
  )
}
