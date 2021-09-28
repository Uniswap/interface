import React from 'react'
import styled from 'styled-components'
import { BridgeTransactionSummary } from '../../state/bridgeTransactions/hooks'

const Tag = styled.div`
  display: inline-block;
  padding: 3px 4px;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  text-transform: uppercase;
  border-radius: 4px;
`

const TagSuccess = styled(Tag)`
  color: #118761;
  background: rgba(14, 159, 110, 0.15);
`

const TagWarning = styled(Tag)`
  color: #a86e3f;
  background: rgba(242, 153, 74, 0.16);
`

export type BridgeStatusTagProps = Pick<BridgeTransactionSummary, 'status'> & {
  onCollect: () => void
}

export const BridgeStatusTag = ({ status, onCollect }: BridgeStatusTagProps) => {
  switch (status) {
    case 'confirmed':
      return <TagSuccess>Confirmed</TagSuccess>
    case 'pending':
      return <TagWarning>Pending</TagWarning>
    case 'redeem':
      return <TagSuccess onClick={onCollect}>Collect</TagSuccess>
    default:
      return <div>status</div>
  }
}
