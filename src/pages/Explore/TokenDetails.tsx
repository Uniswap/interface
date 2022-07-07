import NetworkBalances from 'components/Explore/NetworkBalances'
import TokenDetail from 'components/Explore/TokenDetail'
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
  return (
    <TokenDetailsLayout>
      <TokenDetail address={tokenAddress} />
      <NetworkBalances address={tokenAddress} />
    </TokenDetailsLayout>
  )
}
