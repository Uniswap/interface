import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { rgba } from 'polished'
import { useEffect } from 'react'
import { Clock } from 'react-feather'
import { useSelector } from 'react-redux'
import { useMedia, useSize } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import Bronze from 'assets/svg/bronze_icon.svg'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import InfoHelper from 'components/InfoHelper'
import Pagination from 'components/Pagination'
import Search, { Container as SearchContainer, Wrapper as SearchWrapper } from 'components/Search'
import { BIG_INT_ZERO, CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE, DEFAULT_SIGNIFICANT } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { CampaignState, CampaignStatus, RewardRandom } from 'state/campaigns/actions'
import {
  useSelectedCampaignLeaderboardLookupAddressManager,
  useSelectedCampaignLeaderboardPageNumberManager,
  useSelectedCampaignLuckyWinnerPageNumber,
  useSelectedCampaignLuckyWinnersLookupAddressManager,
} from 'state/campaigns/hooks'
import { formatNumberWithPrecisionRange } from 'utils'
import getShortenAddress from 'utils/getShortenAddress'

const leaderboardTableBodyBackgroundColorsByRank: { [p: string]: string } = {
  1: `linear-gradient(90deg, rgba(255, 204, 102, 0.25) 0%, rgba(255, 204, 102, 0) 54.69%, rgba(255, 204, 102, 0) 100%)`,
  2: `linear-gradient(90deg, rgba(224, 224, 224, 0.25) 0%, rgba(224, 224, 224, 0) 54.69%, rgba(224, 224, 224, 0) 100%)`,
  3: `linear-gradient(90deg, rgba(255, 152, 56, 0.25) 0%, rgba(255, 152, 56, 0) 54.69%, rgba(255, 152, 56, 0) 100%)`,
}

export default function LeaderboardLayout({
  type,
  refreshIn,
}: {
  type: 'leaderboard' | 'lucky_winner'
  refreshIn: number
}) {
  const above1200 = useMedia('(min-width: 1200px)')
  const theme = useTheme()
  const [rank, { width: rankWidth }] = useSize(() => (
    <span>
      <Trans>Rank</Trans>
    </span>
  ))

  const { selectedCampaignLeaderboard, selectedCampaignLuckyWinners, selectedCampaign } = useSelector(
    (state: AppState) => state.campaigns,
  )

  const [currentPage, setCurrentPage] = useSelectedCampaignLeaderboardPageNumberManager()
  const [currentPageLuckyWinner, setCurrentPageLuckyWinner] = useSelectedCampaignLuckyWinnerPageNumber()
  const [leaderboardSearchValue, setLeaderboardSearchValue] = useSelectedCampaignLeaderboardLookupAddressManager()
  const [luckyWinnersSearchValue, setLuckyWinnersSearchValue] = useSelectedCampaignLuckyWinnersLookupAddressManager()
  const [searchValue, setSearchValue] =
    type === 'leaderboard'
      ? [leaderboardSearchValue, setLeaderboardSearchValue]
      : [luckyWinnersSearchValue, setLuckyWinnersSearchValue]

  let totalItems = 0
  if (type === 'leaderboard') {
    if (selectedCampaignLeaderboard) {
      totalItems = leaderboardSearchValue ? 1 : selectedCampaignLeaderboard.numberOfEligibleParticipants
    }
  }
  if (type === 'lucky_winner') {
    if (selectedCampaign && selectedCampaignLeaderboard) {
      const randomRewards = selectedCampaign.rewardDistribution.filter(reward => reward.type === 'Random')
      const totalRandomRewardItems = randomRewards.reduce(
        (acc, reward) => acc + ((reward as RewardRandom).nWinners ?? 0),
        0,
      )

      totalItems = searchValue
        ? 1
        : Math.min(totalRandomRewardItems, selectedCampaignLeaderboard.numberOfEligibleParticipants)
    }
  }

  const refreshInMinute = Math.floor(refreshIn / 60)
  const refreshInSecond = refreshIn - refreshInMinute * 60

  const isRewardShown = Boolean(selectedCampaign && selectedCampaign.isRewardShown)
  const showRewardsColumn = (type === 'leaderboard' && isRewardShown) || type === 'lucky_winner'

  useEffect(() => {
    setCurrentPage(0)
    setCurrentPageLuckyWinner(0)
  }, [selectedCampaign, setCurrentPageLuckyWinner, setCurrentPage])

  const leaderboardTableBody = (selectedCampaignLeaderboard?.rankings ?? []).map((data, index) => {
    const isThisRankingEligible = Boolean(selectedCampaign && data.totalPoint >= selectedCampaign.tradingVolumeRequired)
    const rewardAmount = data.rewardInUSD ? data.rewardAmountUsd : data.rewardAmount

    const rRewardAmount = rewardAmount.equalTo(BIG_INT_ZERO)
      ? '--'
      : data.rewardInUSD && selectedCampaign?.campaignState !== CampaignState.CampaignStateDistributedRewards
      ? t`$${data.rewardAmountUsd.toSignificant(DEFAULT_SIGNIFICANT)}`
      : `${data.rewardAmount.toSignificant(DEFAULT_SIGNIFICANT)} ${data.token.symbol}`

    return (
      <LeaderboardTableBody
        key={index}
        noColumns={isRewardShown ? 4 : 3}
        showMedal={data.rankNo <= 3}
        style={{
          background: leaderboardTableBodyBackgroundColorsByRank[data.rankNo] ?? 'transparent',
        }}
      >
        <LeaderboardTableBodyItem
          align="center"
          style={{ width: (rankWidth === Infinity ? 33 : rankWidth) + 'px', maxHeight: '24px' }}
          isThisRankingEligible={isThisRankingEligible}
        >
          {data.rankNo === 1 ? (
            <MedalImg src={Gold} />
          ) : data.rankNo === 2 ? (
            <MedalImg src={Silver} />
          ) : data.rankNo === 3 ? (
            <MedalImg src={Bronze} />
          ) : isThisRankingEligible ? (
            data.rankNo
          ) : (
            <InfoHelperWrapper>
              <InfoHelper size={14} text={t`Not enough trading volume`} placement="top" style={{ margin: 0 }} />
            </InfoHelperWrapper>
          )}
        </LeaderboardTableBodyItem>
        <LeaderboardTableBodyItem isThisRankingEligible={isThisRankingEligible}>
          {getShortenAddress(data.userAddress, above1200)}
        </LeaderboardTableBodyItem>
        <LeaderboardTableBodyItem align="right" isThisRankingEligible={isThisRankingEligible}>
          {formatNumberWithPrecisionRange(Number(data.totalPoint), 0, 2)}
        </LeaderboardTableBodyItem>
        {showRewardsColumn && (
          <LeaderboardTableBodyItem align="right" isThisRankingEligible={isThisRankingEligible}>
            {rRewardAmount}
          </LeaderboardTableBodyItem>
        )}
      </LeaderboardTableBody>
    )
  })

  const luckyWinnersTableBody = selectedCampaignLuckyWinners.map((luckyWinner, index) => {
    return (
      <LeaderboardTableBody key={index} noColumns={2} showMedal={false} style={{ background: 'transparent' }}>
        <LeaderboardTableBodyItem isThisRankingEligible={true}>
          {getShortenAddress(luckyWinner.userAddress, above1200)}
        </LeaderboardTableBodyItem>
        <LeaderboardTableBodyItem align="right" isThisRankingEligible={true}>
          {luckyWinner.rewardAmount.toSignificant(DEFAULT_SIGNIFICANT)} {luckyWinner.token.symbol}
        </LeaderboardTableBodyItem>
      </LeaderboardTableBody>
    )
  })

  if (selectedCampaign === undefined || selectedCampaign.status === CampaignStatus.UPCOMING)
    return (
      <Flex justifyContent="center" alignItems="center" height="100%" p="16px">
        <Text as="span" textAlign="center">
          <Trans>This campaign does not have a leaderboard yet.</Trans>
        </Text>
      </Flex>
    )

  let rRewardsDistributedAt = ''
  if (selectedCampaignLeaderboard && selectedCampaignLeaderboard.distributedRewardsAt) {
    const formattedUpdatedAt = dayjs(selectedCampaignLeaderboard.distributedRewardsAt * 1000).format('YYYY-MM-DD HH:mm')
    if (selectedCampaign.campaignState === CampaignState.CampaignStateDistributedRewards) {
      rRewardsDistributedAt = `${t`Rewards were distributed at`}: ${formattedUpdatedAt}`
    }
  }

  const onPageChange = (pageNumber: number) => {
    if (type === 'lucky_winner') setCurrentPageLuckyWinner(pageNumber - 1)
    else setCurrentPage(pageNumber - 1)
  }

  return (
    <LeaderboardContainer>
      <TextAndSearchContainer>
        {selectedCampaign.status !== CampaignStatus.ENDED && type === 'leaderboard' ? (
          <TextContainer>
            <SubTextSmall>
              <Trans>Leaderboard refresh in</Trans>
            </SubTextSmall>
            <CountdownContainer>
              <Clock size={12} />
              <Text fontSize="12px" lineHeight="14px">
                {refreshInMinute.toString().length === 1 ? '0' + refreshInMinute : refreshInMinute} :{' '}
                {refreshInSecond.toString().length === 1 ? '0' + refreshInSecond : refreshInSecond}
              </Text>
            </CountdownContainer>
          </TextContainer>
        ) : selectedCampaign.campaignState !== CampaignState.CampaignStateReady ? (
          <TextContainer>
            <SubTextSmall>{rRewardsDistributedAt}</SubTextSmall>
          </TextContainer>
        ) : null}

        <CustomSearchContainer>
          <Search
            placeholder={t`Search by full address`}
            searchValue={searchValue}
            onSearch={setSearchValue}
            style={{ background: theme.buttonBlack }}
          />
        </CustomSearchContainer>
      </TextAndSearchContainer>
      <LeaderboardTable>
        <LeaderboardTableHeader noColumns={type === 'lucky_winner' ? 2 : isRewardShown ? 4 : 3}>
          {type === 'leaderboard' && <LeaderboardTableHeaderItem>{rank}</LeaderboardTableHeaderItem>}
          <LeaderboardTableHeaderItem>
            <Trans>Wallet</Trans>
          </LeaderboardTableHeaderItem>
          {type === 'leaderboard' && (
            <LeaderboardTableHeaderItem align="right">
              <Trans>Points</Trans>
            </LeaderboardTableHeaderItem>
          )}
          {showRewardsColumn && (
            <LeaderboardTableHeaderItem align="right">
              <Trans>Rewards</Trans>
            </LeaderboardTableHeaderItem>
          )}
        </LeaderboardTableHeader>
        {type === 'leaderboard' ? leaderboardTableBody : luckyWinnersTableBody}
      </LeaderboardTable>
      <Pagination
        onPageChange={onPageChange}
        totalCount={totalItems}
        currentPage={type === 'lucky_winner' ? currentPageLuckyWinner + 1 : +currentPage + 1}
        pageSize={CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE}
        style={{ padding: '0' }}
      />
    </LeaderboardContainer>
  )
}

const CustomSearchContainer = styled.div`
  flex: 1 1 100%;

  display: flex;
  justify-content: flex-end;

  ${SearchContainer} {
    flex: 0 1 360px;
  }

  ${SearchWrapper} {
    min-width: unset;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    flex: 0 0;

    ${SearchContainer} {
      flex: 1 1 100%;
    }
  `}
`

const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
`

const TextAndSearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  align-content: center;

  padding: 0 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    gap: 16px;
  `}
`

const TextContainer = styled.div`
  flex-wrap: nowrap;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
`

const SubTextSmall = styled.div`
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
`

const CountdownContainer = styled.div`
  width: 73px;
  flex-wrap: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 12px;
  background: ${({ theme }) => rgba(theme.subText, 0.1)};
  color: ${({ theme }) => theme.subText};
`

const LeaderboardTable = styled.div``

const LeaderboardTableHeader = styled.div<{ noColumns: 2 | 3 | 4 }>`
  padding: 18px 20px;
  display: grid;
  align-items: center;
  background: ${({ theme }) => theme.tableHeader};

  ${({ noColumns }) =>
    noColumns === 4
      ? css`
          grid-template-columns: 7.5fr 52.6fr 19.9fr 19.9fr;
        `
      : noColumns === 3
      ? css`
          grid-template-columns: 7.5fr 52.6fr 39.8fr;
        `
      : css`
          grid-template-columns: 1fr 1fr;
        `}

  ${({ theme, noColumns }) => theme.mediaWidth.upToMedium`
    ${
      noColumns === 4
        ? css`
            grid-template-columns: 1fr 2fr 2fr 2fr;
          `
        : noColumns === 3
        ? css`
            grid-template-columns: 1fr 2fr 1fr;
          `
        : css`
            grid-template-columns: 1fr 1fr;
          `
    }
    }`}

  ${({ theme }) => theme.mediaWidth.upToSmall`padding: 16px;`}
`

const LeaderboardTableHeaderItem = styled.div<{ align?: 'left' | 'right' | 'center' }>`
  font-size: 12px;
  line-height: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  text-transform: uppercase;
  text-align: ${({ align }) => align ?? 'left'};
`

const LeaderboardTableBody = styled(LeaderboardTableHeader)<{ showMedal: boolean }>`
  border-radius: 0;
  background: transparent;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: ${({ showMedal }) => (showMedal ? '16px 20px' : '20px')};

  ${({ theme, showMedal }) =>
    theme.mediaWidth.upToSmall`${css`
      padding: ${showMedal ? '14px 16px' : '16px'};
    `}`}
`

const LeaderboardTableBodyItem = styled.div<{ align?: 'left' | 'right' | 'center'; isThisRankingEligible: boolean }>`
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  text-align: ${({ align }) => align ?? 'left'};
  display: flex;
  justify-content: ${({ align }) => (align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start')};
  color: ${({ isThisRankingEligible, theme }) => (isThisRankingEligible ? theme.text : theme.subText)};
  white-space: nowrap;

  ${({ theme }) =>
    theme.mediaWidth.upToMedium`
      font-size: 12px;
      line-height: 14px;
      font-weight: 400;
    `}
`

const MedalImg = styled.img`
  min-width: 18px;
`

const InfoHelperWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  margin: 0;
  padding: 5px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  border-radius: 50%;
`
