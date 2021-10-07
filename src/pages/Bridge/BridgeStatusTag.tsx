import React from 'react'
import { TagInfo, TagPending, TagSuccess, TagSuccessArrow } from '../../components/Tag'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/types'

export type BridgeStatusTagProps = Pick<BridgeTransactionSummary, 'status' | 'pendingReason'> & {
  onCollect: () => void
}

export const BridgeStatusTag = ({ status, pendingReason, onCollect }: BridgeStatusTagProps) => {
  switch (status) {
    case 'confirmed':
      return <TagSuccess style={{ width: '67px' }}>Confirmed</TagSuccess>
    case 'pending':
      return <TagPending text={pendingReason} />
    case 'redeem':
      return (
        <TagSuccessArrow style={{ width: '67px' }} onClick={onCollect}>
          Collect
        </TagSuccessArrow>
      )
    case 'claimed':
      return <TagInfo style={{ width: '67px' }}>Claimed</TagInfo>
    default:
      return null
  }
}
