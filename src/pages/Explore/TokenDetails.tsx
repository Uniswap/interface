import BalanceSummary from 'components/Explore/BalanceSummary'
import LoadedTokenDetail, { LoadingTokenDetail } from 'components/Explore/TokenDetail'
import { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components/macro'
const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 80px;
`
export function TokenDetails({
  match: {
    params: { tokenAddress },
  },
}: RouteComponentProps<{ tokenAddress: string }>) {
  const [loading, setLoading] = useState(true)
  setTimeout(() => {
    setLoading(false)
  }, 1000)

  const tokenDetailState = loading ? (
    <LoadingTokenDetail />
  ) : (
    <>
      <LoadedTokenDetail address={tokenAddress} />
      <BalanceSummary address={tokenAddress} />
    </>
  )
  return <TokenDetailsLayout>{tokenDetailState}</TokenDetailsLayout>
}
