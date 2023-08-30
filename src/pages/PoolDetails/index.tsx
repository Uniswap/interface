import { usePoolData } from 'graphql/thegraph/PoolData'
import { useParams } from 'react-router-dom'

export default function PoolDetailsPage() {
  const { poolAddress } = useParams<{
    poolAddress: string
  }>()
  const poolData = usePoolData(poolAddress ?? '')
  console.log(poolData)
  return <></>
}
