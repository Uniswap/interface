import { useSearchParams } from 'react-router'
import { usePoolAreaNavigation } from '~/features/Explore/poolArea/hooks/usePoolAreaNavigation'
import { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { parseHooksFixtureScenario } from '~/features/Hooks/fixtures'
import { PoolAreaHeroHeader } from '~/features/Liquidity/PoolAreaHeroHeader'
import { PoolAreaLayout } from '~/features/Liquidity/PoolAreaLayout'
import { PoolAreaTabs } from '~/features/Liquidity/PoolAreaTabs'
import { HooksTable } from '~/pages/Explore/tables/Hooks/HooksTable'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export default function HooksPage(): JSX.Element {
  const [params] = useSearchParams()
  const scenario = parseHooksFixtureScenario(params.get('hooksFixtureScenario'))
  const chainId = useChainIdFromUrlParam()
  const urls = usePoolAreaNavigation()

  return (
    <>
      <PoolAreaHeroHeader hideContentOnMobile />
      <PoolAreaLayout gap="$spacing24" py="$spacing24" $md={{ px: '$none' }}>
        <PoolAreaTabs activeTab={PoolAreaTab.Hooks} urls={urls} />
        <HooksTable scenario={scenario} chainId={chainId} />
      </PoolAreaLayout>
    </>
  )
}
