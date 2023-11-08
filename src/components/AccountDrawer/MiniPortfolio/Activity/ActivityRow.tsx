import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import Column from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import useENSName from 'hooks/useENSName'
import { useCallback } from 'react'
import styled from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow from '../PortfolioRow'
import { useOpenOffchainActivityModal } from './OffchainActivityModal'
import { useTimeSince } from './parseRemote'
import { Activity } from './types'

const ActivityRowDescriptor = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.neutral2};
  ${EllipsisStyle}
`

const StyledTimestamp = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.neutral2};
  font-variant: small;
  font-feature-settings: 'tnum' on, 'lnum' on, 'ss02' on;
`

function StatusIndicator({ activity: { status, timestamp } }: { activity: Activity }) {
  const timeSince = useTimeSince(timestamp)

  switch (status) {
    case TransactionStatus.Pending:
      return <LoaderV2 />
    case TransactionStatus.Confirmed:
      return <StyledTimestamp>{timeSince}</StyledTimestamp>
    case TransactionStatus.Failed:
      return <AlertTriangleFilled />
  }
}

export function ActivityRow({ activity }: { activity: Activity }) {
  const { chainId, title, descriptor, logos, otherAccount, currencies, hash, prefixIconSrc, offchainOrderStatus } =
    activity
  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const { ENSName } = useENSName(otherAccount)
  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)

  const onClick = useCallback(() => {
    if (offchainOrderStatus) {
      openOffchainActivityModal({ orderHash: hash, status: offchainOrderStatus })
      return
    }

    window.open(getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION), '_blank')
  }, [offchainOrderStatus, chainId, hash, openOffchainActivityModal])

  return (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={SharedEventName.ELEMENT_CLICKED}
      element={InterfaceElementName.MINI_PORTFOLIO_ACTIVITY_ROW}
      properties={{ hash, chain_id: chainId, explorer_url: explorerUrl }}
    >
      <PortfolioRow
        left={
          <Column>
            <PortfolioLogo chainId={chainId} currencies={currencies} images={logos} accountAddress={otherAccount} />
          </Column>
        }
        title={
          <Row gap="4px">
            {prefixIconSrc && <img height="14px" width="14px" src={prefixIconSrc} alt="" />}
            <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
          </Row>
        }
        descriptor={
          <ActivityRowDescriptor color="neutral2">
            {descriptor}
            {ENSName ?? shortenAddress(otherAccount)}
          </ActivityRowDescriptor>
        }
        right={<StatusIndicator activity={activity} />}
        onClick={onClick}
      />
    </TraceEvent>
  )
}
