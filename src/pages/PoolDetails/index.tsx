import { supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useParams } from 'react-router-dom'

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const chainId = supportedChainIdFromGQLChain(chain)
  const poolData = usePoolData(poolAddress ?? '', chainId)
  console.log(poolData)
  return <></>
}
