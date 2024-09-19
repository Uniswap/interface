import { InterfaceElementName } from '@uniswap/analytics-events'
import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { useTimeSince } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useCallback } from 'react'
import { SignatureType } from 'state/signatures/types'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const ActivityRowDescriptor = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.neutral2};
  ${EllipsisStyle}
`

const StyledTimestamp = styled(ThemedText.BodySmall)`
  color: ${({ theme }) => theme.neutral2};
  font-variant: small;
  font-feature-settings:
    'tnum' on,
    'lnum' on,
    'ss02' on;
`

function StatusIndicator({ activity: { status, timestamp, offchainOrderDetails } }: { activity: Activity }) {
  const timeSince = useTimeSince(timestamp)

  switch (status) {
    case TransactionStatus.Pending:
      if (offchainOrderDetails?.type === SignatureType.SIGN_LIMIT) {
        return null
      }
      return <LoaderV2 />
    case TransactionStatus.Confirmed:
      return <StyledTimestamp>{timeSince}</StyledTimestamp>
    case TransactionStatus.Failed:
      return <AlertTriangleFilled />
  }
}

// TODO WEB-4550 - Fix regression where ENS name is not displayed in activity row
export function ActivityRow({ activity }: { activity: Activity }) {
  const {
    chainId,
    title,
    descriptor,
    logos,
    otherAccount,
    currencies,
    hash,
    prefixIconSrc,
    suffixIconSrc,
    offchainOrderDetails,
  } = activity

  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)

  const onClick = useCallback(() => {
    if (offchainOrderDetails) {
      openOffchainActivityModal(offchainOrderDetails, {
        inputLogo: activity?.logos?.[0],
        outputLogo: activity?.logos?.[1],
      })
      return
    }

    window.open(getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION), '_blank')
  }, [activity?.logos, chainId, hash, offchainOrderDetails, openOffchainActivityModal])

  return (
    <Trace
      logPress
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
            {suffixIconSrc && <img height="14px" width="14px" src={suffixIconSrc} alt="" />}
          </Row>
        }
        descriptor={<ActivityRowDescriptor color="neutral2">{descriptor}</ActivityRowDescriptor>}
        right={<StatusIndicator activity={activity} />}
        onClick={onClick}
      />
    </Trace>
  )
}
