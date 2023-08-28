import { useParams } from 'react-router-dom'

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName?: string
  }>()
  return <></>
}
