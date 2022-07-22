import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Explore/constants'
import BalanceSummary from 'components/Explore/TokenDetails/BalanceSummary'
import LoadingTokenDetail from 'components/Explore/TokenDetails/LoadingTokenDetail'
import TokenDetail from 'components/Explore/TokenDetails/TokenDetail'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 80px;
  padding: 0px 20px;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    gap: 40px;
  }
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding: 0px 16px;
  }
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    padding: 0px 8px;
  }
`
const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const Widget = styled.div`
  height: 348px;
  width: 284px;
  background-color: ${({ theme }) => theme.backgroundContainer};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`
export default function TokenDetails() {
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
