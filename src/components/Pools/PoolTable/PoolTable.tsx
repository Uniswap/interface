import { ExploreTable } from 'components/Explore/ExploreTable'
import { ExploreTab } from 'constants/explore'
import { validateUrlChainParam } from 'graphql/data/util'
import { useParams } from 'react-router-dom'

export default function PoolTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)

  return <ExploreTable tab={ExploreTab.Pools} />
}
