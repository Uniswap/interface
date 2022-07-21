import BalanceSummary from 'components/Explore/BalanceSummary'
import LoadingTokenDetail from 'components/Explore/LoadingTokenDetail'
import TokenDetail from 'components/Explore/TokenDetail'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 80px;
`
const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`
const Widget = styled.div`
  height: 354px;
  width: 284px;
  background-color: ${({ theme }) => theme.deprecated_bg2};
  border-radius: 12px;
  border: 1px solid rgba(153, 161, 189, 0.24);
`
export function TokenDetails() {
  const { tokenAddress } = useParams<{ tokenAddress?: string }>()
  const [loading, setLoading] = useState(true)
  setTimeout(() => {
    setLoading(false)
  }, 1000)

  let tokenDetail
  if (!tokenAddress) {
    // TODO: handle no address / invalid address cases
    tokenDetail = 'invalid token'
  } else if (loading) {
    tokenDetail = <LoadingTokenDetail />
  } else {
    tokenDetail = <TokenDetail address={tokenAddress} />
  }

  return (
    <TokenDetailsLayout>
      {tokenDetail}
      {tokenAddress && (
        <RightPanel>
          <Widget />
          {!loading && <BalanceSummary address={tokenAddress} />}
        </RightPanel>
      )}
    </TokenDetailsLayout>
  )
}
