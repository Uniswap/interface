import React from 'react'
import { Text } from 'rebass'
import { Clock } from 'react-feather'
import { useSelector } from 'react-redux'
import { t, Trans } from '@lingui/macro'
import styled, { css } from 'styled-components'
import { useMedia, useSize } from 'react-use'
import { rgba } from 'polished'

import Search, { Wrapper as SearchWrapper, Container as SearchContainer } from 'components/Search'
import getShortenAddress from 'utils/getShortenAddress'
import { formatNumberWithPrecisionRange } from 'utils'
import useTheme from 'hooks/useTheme'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import Pagination from 'components/Pagination'
import { CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE, DEFAULT_SIGNIFICANT } from 'constants/index'
import { AppState } from 'state'
import {
  useSelectedCampaignLeaderboardLookupAddressManager,
  useSelectedCampaignLeaderboardPageNumberManager,
  useSelectedCampaignLuckyWinnersLookupAddressManager,
} from 'state/campaigns/hooks'
import InfoHelper from 'components/InfoHelper'
import { CampaignState } from 'state/campaigns/actions'

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

  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)
  const selectedCampaignLuckyWinners = useSelector((state: AppState) => state.campaigns.selectedCampaignLuckyWinners)

  const [currentPage, setCurrentPage] = useSelectedCampaignLeaderboardPageNumberManager()
  const [leaderboardSearchValue, setLeaderboardSearchValue] = useSelectedCampaignLeaderboardLookupAddressManager()
  const [luckyWinnersSearchValue, setLuckyWinnersSearchValue] = useSelectedCampaignLuckyWinnersLookupAddressManager()
  const [searchValue, setSearchValue] =
    type === 'leaderboard'
      ? [leaderboardSearchValue, setLeaderboardSearchValue]
      : [luckyWinnersSearchValue, setLuckyWinnersSearchValue]

  let totalItems = 0
  if (type === 'leaderboard') {
    totalItems = selectedCampaignLeaderboard
      ? leaderboardSearchValue
        ? 1
        : selectedCampaignLeaderboard.numberOfParticipants
      : 0
  } else {
    // TODO nguyenhuudungz: Fix when backend return total lucky winners.
    totalItems = searchValue ? 1 : 500
  }

  const refreshInMinute = Math.floor(refreshIn / 60)
  const refreshInSecond = refreshIn - refreshInMinute * 60
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const isRewardShown = Boolean(selectedCampaign && selectedCampaign.isRewardShown)
  const showRewardsColumn = (type === 'leaderboard' && isRewardShown) || type === 'lucky_winner'

  const leaderboardTableBody = (selectedCampaignLeaderboard?.rankings ?? []).map((data, index) => {
    const isThisRankingEligible = Boolean(selectedCampaign && data.totalPoint >= selectedCampaign.tradingVolumeRequired)
    return (
      <LeaderboardTableBody
        key={index}
        noColumns={isRewardShown ? 4 : 3}
        showMedal={data.rankNo <= 3}
        style={{
          background: leaderboardTableBodyBackgroundColorsByRank[data.rankNo.toString()] ?? 'transparent',
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
            {data.rewardAmount.toSignificant(DEFAULT_SIGNIFICANT)} {data?.token?.symbol ?? ''}
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

  if (selectedCampaign === undefined || selectedCampaign.status === 'Upcoming')
    return (
      <div>
        <Trans>This campaign does not have a leaderboard yet.</Trans>
      </div>
    )

  return (
    <LeaderboardContainer>
      <RefreshTextAndSearchContainer>
        {selectedCampaign.campaignState === CampaignState.CampaignStateReady && type === 'leaderboard' && (
          <RefreshTextContainer>
            <RefreshText>
              <Trans>Leaderboard refresh in</Trans>
            </RefreshText>
            <CountdownContainer>
              <Clock size={12} />
              <Text fontSize="12px" lineHeight="14px">
                {refreshInMinute.toString().length === 1 ? '0' + refreshInMinute : refreshInMinute} :{' '}
                {refreshInSecond.toString().length === 1 ? '0' + refreshInSecond : refreshInSecond}
              </Text>
            </CountdownContainer>
          </RefreshTextContainer>
        )}

        <CustomSearchContainer>
          <Search
            placeholder={t`Search by full address`}
            searchValue={searchValue}
            onSearch={setSearchValue}
            style={{ background: theme.buttonBlack }}
          />
        </CustomSearchContainer>
      </RefreshTextAndSearchContainer>
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
        onPageChange={pageNumber => setCurrentPage(pageNumber - 1)}
        totalCount={totalItems}
        currentPage={currentPage + 1}
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

const RefreshTextAndSearchContainer = styled.div`
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

const RefreshTextContainer = styled.div`
  flex-wrap: nowrap;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
`

const RefreshText = styled.div`
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
