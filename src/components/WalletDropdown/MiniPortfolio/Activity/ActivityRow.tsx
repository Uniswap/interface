import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import { TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import useENSName from 'hooks/useENSName'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow from '../PortfolioRow'
import { useTimeSince } from './parseRemote'
import { Activity } from './types'

const ActivityRowDescriptor = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.textSecondary};
  ${EllipsisStyle}
`

const StyledTimestamp = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.textSecondary};
  font-variant: small;
  font-feature-settings: 'tnum' on, 'lnum' on, 'ss02' on;
`

export function ActivityRow({
  activity: { chainId, status, title, descriptor, logos, otherAccount, currencies, timestamp, hash },
}: {
  activity: Activity
}) {
  const { ENSName } = useENSName(otherAccount)
  const timeSince = useTimeSince(timestamp)

  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)

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
        title={<ThemedText.SubHeader fontWeight={500}>{title}</ThemedText.SubHeader>}
        descriptor={
          <ActivityRowDescriptor color="textSecondary">
            {descriptor}
            {ENSName ?? otherAccount}
          </ActivityRowDescriptor>
        }
        right={
          status === TransactionStatus.Pending ? (
            <LoaderV2 />
          ) : status === TransactionStatus.Confirmed ? (
            <StyledTimestamp>{timeSince}</StyledTimestamp>
          ) : (
            <AlertTriangleFilled />
          )
        }
        onClick={() => window.open(explorerUrl, '_blank')}
      />
    </TraceEvent>
  )
}
