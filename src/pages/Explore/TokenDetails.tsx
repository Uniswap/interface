import BalanceSummary from 'components/Explore/BalanceSummary'
import LoadedTokenDetail, { LoadingTokenDetail } from 'components/Explore/TokenDetail'
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
  const loading = true
  if (loading)
    return (
      <TokenDetailsLayout>
        <LoadingTokenDetail />
      </TokenDetailsLayout>
    )
  return (
    <TokenDetailsLayout>
      <LoadedTokenDetail address={tokenAddress} />
      <BalanceSummary address={tokenAddress} />
    </TokenDetailsLayout>
  )
}
