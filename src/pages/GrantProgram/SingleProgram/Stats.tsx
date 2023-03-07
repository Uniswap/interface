import { rgba } from 'polished'
import { Flex } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as CampaignParticipants } from 'assets/svg/campaign_participants.svg'
import { ReactComponent as CampaignTrades } from 'assets/svg/campaign_trades.svg'
import { ReactComponent as CampaignVolume } from 'assets/svg/campaign_volume.svg'
import Loader from 'components/Loader'

const StatsCardWrapper = styled.div`
  display: flex;
  padding: 0 24px;
  height: 98px;
  align-items: center;
  background-color: ${({ theme }) => rgba(theme.buttonGray, 0.8)};
  gap: 16px;
  border-radius: 20px;
`

const CardValue = styled.span`
  font-weight: 500;
  font-size: 28px;

  color: ${({ theme }) => theme.text};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-weight: 500;
    font-size: 20px;
  `}
`

const CardTitle = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;

  color: ${({ theme }) => theme.subText};
`

const CardContentWrapper = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  gap: 4px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding-top: 24px;
    align-items: center;
  `}
`

type CardProps = {
  icon: React.ReactNode
  value?: string
  title: string
}
const StatsCard: React.FC<CardProps> = ({ icon, value, title }) => {
  return (
    <StatsCardWrapper>
      <Flex flex="0 0 72px" justifyContent="center" alignItems="center">
        {icon}
      </Flex>

      <CardContentWrapper>
        <CardValue>{value || <Loader />}</CardValue>
        <CardTitle>{title}</CardTitle>
      </CardContentWrapper>
    </StatsCardWrapper>
  )
}

type Props = {
  participants?: number
  volume?: string
  trades?: number
}

const formatTradingVolume = (v: string) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumSignificantDigits: 2,
  })

  return formatter.format(Number(v))
}

const formatNumber = (v: number) => {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumSignificantDigits: 2,
  })

  return formatter.format(v)
}

const StatsWrapper = styled.div`
  width: 100%;

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  justify-content: center;
  gap: 24px;

  @media (max-width: 1080px) {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 24px;
    > ${StatsCardWrapper} {
      width: calc((100% - 24px) / 2);
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      > ${StatsCardWrapper} {
        width: 100%;
      }
  `}
`

const Stats: React.FC<Props> = ({ participants, trades, volume }) => {
  return (
    <StatsWrapper>
      <StatsCard
        icon={<CampaignVolume />}
        value={volume ? formatTradingVolume(volume) : volume}
        title="Total Trading Volume"
      />
      <StatsCard
        icon={<CampaignParticipants />}
        value={participants !== undefined ? formatNumber(participants) : participants}
        title="Total Participants"
      />
      <StatsCard
        icon={<CampaignTrades />}
        value={trades !== undefined ? formatNumber(trades) : trades}
        title="Total Number of Trades"
      />
    </StatsWrapper>
  )
}

export default Stats
