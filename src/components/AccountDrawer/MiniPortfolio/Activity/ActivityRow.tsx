import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import ParentSize from '@visx/responsive/lib/components/ParentSize'
import { TraceEvent } from 'analytics'
import { PriceChart } from 'components/Charts/PriceChart'
import Column from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import Row from 'components/Row'
import { JudgementalActivity } from 'components/SocialFeed/hooks'
import { usePriceHistory } from 'components/Tokens/TokenDetails/ChartSection'
import {
  Chain,
  HistoryDuration,
  TransactionStatus,
  useTokenPriceQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod } from 'graphql/data/util'
import { getV2Prices } from 'graphql/thegraph/getV2Prices'
import useENSName from 'hooks/useENSName'
import { ClickableText } from 'pages/Pool/styled'
import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { EllipsisStyle, ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'
import { useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { PortfolioAvatar, PortfolioLogo } from '../PortfolioLogo'
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

function isJudgementalActivity(activity: Activity | JudgementalActivity): activity is JudgementalActivity {
  return (activity as JudgementalActivity).isJudgmental !== undefined
}

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;

  gap: 20px;
  padding: 20px;
  width: 100%;
  /* width: 420px; */

  /* background-color: ${({ theme }) => theme.surface1}; */
  /* border-radius: 12px; */
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`
const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  justify-content: space-between;
  white-space: nowrap;
`

const Who = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
`

const DescriptionContainer = styled(Row)`
  white-space: nowrap;
  flex-wrap: wrap;
`

function NormalFeedRow({ activity }: { activity: Activity }) {
  const { ENSName } = useENSName(activity.owner)
  const { ENSName: otherAccountENS } = useENSName(activity.otherAccount)
  const timeSince = useTimeSince(activity.timestamp)

  const navigate = useNavigate()

  const shouldHide = useMemo(
    () =>
      activity.title.includes('Approv') ||
      activity.title.includes('Contract') ||
      activity.descriptor?.includes('Contract') ||
      activity.title.includes('Sent') ||
      activity.title?.includes('Swapped') ||
      activity.title.includes('Received') ||
      activity.title.includes('Unknown'),
    [activity.title, activity.descriptor]
  )
  if (shouldHide) return null

  return (
    <ActivityCard>
      <CardHeader>
        <Who>
          <PortfolioAvatar accountAddress={activity.owner} size={30} />
          <ClickableText onClick={() => navigate('/account/' + ENSName ?? activity.owner)}>
            <ThemedText.BodyPrimary>{ENSName ?? shortenAddress(activity.owner)}</ThemedText.BodyPrimary>
          </ClickableText>
        </Who>
        <ThemedText.LabelSmall>{timeSince}</ThemedText.LabelSmall>
      </CardHeader>
      <ThemedText.BodySecondary color="neutral1">
        <DescriptionContainer gap="8px">
          {activity.title} {activity.descriptor}{' '}
          <PortfolioLogo size="24px" chainId={1} currencies={activity.currencies} />{' '}
          <ClickableText onClick={() => navigate(`/account/${otherAccountENS ?? activity.otherAccount}`)}>
            <b>{otherAccountENS ?? activity.otherAccount}</b>
          </ClickableText>
        </DescriptionContainer>
      </ThemedText.BodySecondary>
    </ActivityCard>
  )
}

function JudgementChart({ activity, hidePrice }: { activity: JudgementalActivity; hidePrice?: boolean }) {
  const theme = useTheme()
  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: activity.currency.wrapped.address,
      chain: Chain.Ethereum,
      duration: HistoryDuration.Year,
    },
    errorPolicy: 'all',
  })

  const prices = usePriceHistory(tokenPriceQuery)

  useEffect(() => {
    getV2Prices(activity.currency.wrapped.address).then(console.log)
  }, [])

  if (!prices) return null

  return (
    <ParentSize>
      {({ width }) => (
        <PriceChart
          prices={prices}
          width={width}
          height={200}
          timePeriod={TimePeriod.YEAR}
          activity={activity.activities}
          color={activity.negative ? theme.critical : theme.success}
          hidePrice={hidePrice}
          backupAddress={activity.currency.wrapped.address}
        />
      )}
    </ParentSize>
  )
}

function JudgementalActivityRow({ activity, hidePrice }: { activity: JudgementalActivity; hidePrice?: boolean }) {
  const { ENSName } = useENSName(activity.owner)
  const timeSince = useTimeSince(activity.timestamp)
  const { formatNumber } = useFormatter()
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <ActivityCard>
      <CardHeader>
        <Who>
          <PortfolioAvatar accountAddress={activity.owner} size={30} />
          <ClickableText onClick={() => navigate('/account/' + activity.owner)}>
            <ThemedText.BodyPrimary>{ENSName ?? shortenAddress(activity.owner)}</ThemedText.BodyPrimary>
          </ClickableText>
        </Who>
        <ThemedText.LabelSmall>{timeSince}</ThemedText.LabelSmall>
      </CardHeader>
      <JudgementChart activity={activity} hidePrice={hidePrice} />
      <ThemedText.BodySecondary color="neutral1">
        <DescriptionContainer gap="8px">
          {activity.description} <PortfolioLogo size="24px" chainId={1} currencies={[activity.currency]} />{' '}
          <ClickableText
            onClick={() =>
              navigate(
                '/tokens/ethereum/' + (activity.currency.isNative ? 'NATIVE' : activity.currency.wrapped.address)
              )
            }
          >
            <b>{activity.currency.symbol}</b>
          </ClickableText>
          <span style={{ color: activity.profit > 0 ? theme.success : theme.critical }}>
            {activity.profit < 0 ? '-' : ''}(${Math.abs(activity.profit).toFixed(2)})
          </span>{' '}
          {activity.hodlingTimescale}
        </DescriptionContainer>
      </ThemedText.BodySecondary>
    </ActivityCard>
  )
}

export function FeedRow({ activity, hidePrice }: { activity: Activity | JudgementalActivity; hidePrice?: boolean }) {
  if (!isJudgementalActivity(activity)) {
    return <NormalFeedRow activity={activity} />
    // return null
  }
  return <JudgementalActivityRow activity={activity} hidePrice={hidePrice} />
}
