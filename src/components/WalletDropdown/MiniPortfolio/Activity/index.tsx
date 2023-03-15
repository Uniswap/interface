import { t } from '@lingui/macro'
import { ReactComponent as UnknownStatus } from 'assets/svg/contract-interaction.svg'
import Column from 'components/Column'
import Loader from 'components/Loader'
import { LoadingBubble } from 'components/Tokens/loading'
import { Unicon } from 'components/Unicon'
import { getYear, isSameDay, isSameMonth, isSameWeek, isSameYear } from 'date-fns'
import { useTransactionListQuery } from 'graphql/data/__generated__/types-and-hooks'
import useENSAvatar from 'hooks/useENSAvatar'
import useENSName from 'hooks/useENSName'
import { useMemo } from 'react'
import { HelpCircle } from 'react-feather'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'
import { Activity, parseRemoteActivities, timeSince } from './parse'

interface ActivityGroup {
  title: string
  transactions: Array<Activity>
}

const createGroups = (activities?: Array<Activity>) => {
  if (!activities || !activities.length) return []
  const now = Date.now()

  const today: Array<Activity> = []
  const currentWeek: Array<Activity> = []
  const last30Days: Array<Activity> = []
  const currentYear: Array<Activity> = []
  const yearMap: { [key: string]: Array<Activity> } = {}

  // TODO(cartcrom): create different time bucket system for activities to fall in based on design wants
  activities.forEach((activity) => {
    const addedTime = activity.timestamp * 1000

    if (isSameDay(now, addedTime)) {
      today.push(activity)
    } else if (isSameWeek(addedTime, now)) {
      currentWeek.push(activity)
    } else if (isSameMonth(addedTime, now)) {
      last30Days.push(activity)
    } else if (isSameYear(addedTime, now)) {
      currentYear.push(activity)
    } else {
      const year = getYear(addedTime)

      if (!yearMap[year]) {
        yearMap[year] = [activity]
      } else {
        yearMap[year].push(activity)
      }
    }
  })
  const sortedYears = Object.keys(yearMap)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .map((year) => ({ title: year, transactions: yearMap[year] }))

  const transactionGroups: Array<ActivityGroup> = [
    { title: t`Today`, transactions: today },
    { title: t`This week`, transactions: currentWeek },
    { title: t`This month`, transactions: last30Days },
    { title: t`This year`, transactions: currentYear },
    ...sortedYears,
  ]

  return transactionGroups.filter((transactionInformation) => transactionInformation.transactions.length > 0)
}

const ActivityGroupWrapper = styled(Column)`
  margin-top: 16px;
  gap: 8px;
`

export default function ActivityTab({ account }: { account: string }) {
  const { data, loading } = useTransactionListQuery({
    variables: { account },
    errorPolicy: 'all',
  })
  const remoteActivities = useMemo(() => parseRemoteActivities(data?.portfolios?.[0].assetActivities), [data])
  const activityGroups = useMemo(() => createGroups(remoteActivities), [remoteActivities])

  // TODO(cartcrom): add no activity state
  return !data && loading ? (
    <>
      <LoadingBubble height="16px" width="80px" margin="16px 16px 8px" />
      <PortfolioSkeleton shrinkRight />
    </>
  ) : (
    <PortfolioTabWrapper>
      {activityGroups.map((activityGroup) => (
        <ActivityGroupWrapper key={activityGroup.title}>
          <ThemedText.SubHeader color="textSecondary" fontWeight={500} marginLeft="16px">
            {activityGroup.title}
          </ThemedText.SubHeader>
          <Column>
            {activityGroup.transactions.map((activity) => (
              <ActivityRow key={activity.receipt.hash} activity={activity} />
            ))}
          </Column>
        </ActivityGroupWrapper>
      ))}
    </PortfolioTabWrapper>
  )
}

const StyledLogo = styled.img`
  height: 40px;
  width: 40px;
  border-radius: 50%;
  aspect-ratio: 1;
`

const DoubleLogoContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2px;
  ${StyledLogo}:nth-child(n) {
    width: 19px;
    object-fit: cover;
  }
  ${StyledLogo}:nth-child(1) {
    border-radius: 20px 0 0 20px;
    object-position: 0 0;
  }
  ${StyledLogo}:nth-child(2) {
    border-radius: 0 20px 20px 0;
    object-position: 100% 0;
  }
`

const ENSAvatarImg = styled.img`
  border-radius: 8px;
  height: 40px;
  width: 40px;
`

const UnknownContract = styled(UnknownStatus)`
  color: ${({ theme }) => theme.textSecondary};
  height: 40px;
  width: 40px;
`

function ActivityLogo({ srcs, otherAccount }: { srcs?: Array<string | undefined>; otherAccount?: string }) {
  const { avatar, loading } = useENSAvatar(otherAccount, false)
  if (otherAccount) {
    return loading ? (
      <Loader size="40px" />
    ) : avatar ? (
      <ENSAvatarImg src={avatar} alt="avatar" />
    ) : (
      <Unicon size={40} address={otherAccount} />
    )
  } else if (!srcs || srcs.length === 0) {
    return <UnknownContract />
  } else if (srcs.length > 1) {
    // TODO(cartcrom): add default img for half logo component w/ undefined src
    return (
      <DoubleLogoContainer>
        <StyledLogo src={srcs[0]} />
        <StyledLogo src={srcs[srcs.length - 1]} />
      </DoubleLogoContainer>
    )
  } else {
    return srcs[0] ? <StyledLogo src={srcs[0]} /> : <HelpCircle size={40} />
  }
}

const StyledDescriptor = styled(ThemedText.BodySmall)`
  ${EllipsisStyle}
`

const StyledTimestamp = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.textSecondary};
  font-variant: small;
  font-feature-settings: 'tnum' on, 'lnum' on, 'ss02' on;
`

function ActivityRow({ activity }: { activity: Activity }) {
  const { title, descriptor, logos, otherAccount } = activity
  const { ENSName } = useENSName(otherAccount)
  const explorerUrl = getExplorerLink(activity.chainId, activity.receipt.hash, ExplorerDataType.TRANSACTION)

  return (
    <PortfolioRow
      left={
        <Column>
          <ActivityLogo srcs={logos} otherAccount={otherAccount} />
        </Column>
      }
      title={
        <ThemedText.SubHeader fontWeight={500} color="accentSuccess">
          {title}
        </ThemedText.SubHeader>
      }
      descriptor={
        <StyledDescriptor>
          {descriptor}
          {ENSName ?? otherAccount}
        </StyledDescriptor>
      }
      right={<StyledTimestamp>{timeSince(activity.timestamp)}</StyledTimestamp>}
      onClick={() => window.open(explorerUrl, '_blank')}
    />
  )
}
