import { YellowCard } from 'components/Card'
import React from 'react'
import styled from 'styled-components'
import { NETWORK_LABELS, SupportedChainId } from '../../constants/chains'

const FallbackWrapper = styled(YellowCard)`
  border-radius: 12px;
  padding: 8px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
  `};
`

interface NetworkCardProps {
  chainId?: SupportedChainId
}
export default function NetworkCard({ chainId }: NetworkCardProps) {
  if (!chainId || chainId === SupportedChainId.MAINNET || !NETWORK_LABELS[chainId]) {
    return null
  }
  if (chainId === SupportedChainId.ARBITRUM_ONE) {
    return (
      <div>
        <span>Arbitrum</span>
        <span>Alpha L2</span>
      </div>
    )
  }

  return <FallbackWrapper title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</FallbackWrapper>
}
