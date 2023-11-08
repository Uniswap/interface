import { ExploreTable } from 'components/Explore/ExploreTable'
import { ExploreTab } from 'constants/explore'
import { useTopTokens } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { useParams } from 'react-router-dom'

export default function TokenTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)
  const { tokens, tokenSortRank, loadingTokens, sparklines } = useTopTokens(chainName)

  return (
    <ExploreTable
      tab={ExploreTab.Tokens}
      tokens={tokens}
      tokenSortRank={tokenSortRank}
      loadingTokens={loadingTokens}
      sparklineMap={sparklines}
    />
  )
}
