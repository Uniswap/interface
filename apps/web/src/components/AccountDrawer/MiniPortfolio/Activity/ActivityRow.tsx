import { useOpenOffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import { useTimeSince } from 'components/AccountDrawer/MiniPortfolio/Activity/parseRemote'
import { Activity } from 'components/AccountDrawer/MiniPortfolio/Activity/types'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import PortfolioRow from 'components/AccountDrawer/MiniPortfolio/PortfolioRow'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import styled from 'lib/styled-components'
import { useCallback } from 'react'
import { ThemedText } from 'theme/components'
import { EllipsisStyle } from 'theme/components/styles'
import { BridgeIcon } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { TransactionType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { isHash } from 'viem'

const ActivityRowDescriptor = styled(ThemedText.BodySmall)`
    color: ${({ theme }) => theme.neutral2};
    ${EllipsisStyle}
    max-width: 100%;
`

const StyledTimestamp = styled(ThemedText.BodySmall)`
    color: ${({ theme }) => theme.neutral2};
    line-height: 24px;
    font-variant: small;
    padding-right: 8px;
    font-feature-settings: 'tnum' on,
    'lnum' on,
    'ss02' on;
`

function StatusIndicator({
  activity: { status, timestamp, offchainOrderDetails },
}: {
  activity: Activity
}): JSX.Element | null {
  const timeSince = useTimeSince(timestamp)

  switch (status) {
    case TransactionStatus.Pending:
      if (offchainOrderDetails?.routing === Routing.DUTCH_LIMIT) {
        return null
      }
      return <LoaderV2 />
    case TransactionStatus.Success:
    case TransactionStatus.Expired:
      return <StyledTimestamp>{timeSince}</StyledTimestamp>
    case TransactionStatus.Failed:
    case TransactionStatus.FailedCancel:
      return <AlertTriangleFilled />
    default:
      logger.error(new Error(`Unhandled web transaction status`), {
        tags: {
          file: 'ActivityRow.tsx',
          function: 'StatusIndicator',
        },
        extra: { status },
      })
      return null
  }
}

// TODO WEB-4550 - Fix regression where ENS name is not displayed in activity row
export function ActivityRow({ activity }: { activity: Activity }) {
  const {
    chainId,
    title,
    descriptor,
    otherAccount,
    currencies,
    hash,
    prefixIconSrc,
    suffixIconSrc,
    offchainOrderDetails,
    logos,
    type,
  } = activity

  // TODO(WEB-5146): Create tamagui universal Activity component, remove one off bridge styling
  const isBridge = type === TransactionType.Bridging

  const openOffchainActivityModal = useOpenOffchainActivityModal()

  const explorerUrl = getExplorerLink({ chainId, data: hash, type: ExplorerDataType.TRANSACTION })

  const onClick = useCallback(() => {
    if (offchainOrderDetails) {
      openOffchainActivityModal(offchainOrderDetails, {
        inputLogo: activity.logos?.[0],
        outputLogo: activity.logos?.[1],
      })
      return
    }
    // Do not allow FOR activity to be opened until confirmed on chain
    // UniswapX orders may not have a hash, so we need to check for that
    if (activity.status === TransactionStatus.Pending && (!hash || !isHash(hash))) {
      return
    }

    window.open(explorerUrl, '_blank')
  }, [activity.logos, activity.status, explorerUrl, hash, offchainOrderDetails, openOffchainActivityModal])

  return (
    <Trace
      logPress
      element={ElementName.MiniPortfolioActivityRow}
      properties={{ hash, chain_id: chainId, explorer_url: explorerUrl }}
    >
      <PortfolioRow
        left={
          <Column>
            <PortfolioLogo
              chainId={chainId}
              currencies={currencies}
              images={logos}
              accountAddress={otherAccount}
              customIcon={isBridge ? BridgeIcon : undefined}
            />
          </Column>
        }
        title={
          <Row align="space-between" justify-content="center">
            <Row gap="4px">
              {prefixIconSrc && <img height="14px" width="14px" src={prefixIconSrc} alt="" />}
              <ThemedText.SubHeader>{title}</ThemedText.SubHeader>
              {suffixIconSrc && <img height="14px" width="14px" src={suffixIconSrc} alt="" />}
            </Row>
            <StatusIndicator activity={activity} />
          </Row>
        }
        descriptor={<ActivityRowDescriptor color="neutral2">{descriptor}</ActivityRowDescriptor>}
        onClick={onClick}
      />
    </Trace>
  )
}
