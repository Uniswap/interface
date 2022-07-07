import React from 'react'
import { Text } from 'rebass'
import { Clock } from 'react-feather'
import Search from 'components/Search'
import { t, Trans } from '@lingui/macro'
import getShortenAddress from 'utils/getShortenAddress'
import { formatNumberWithPrecisionRange } from 'utils'
import styled, { css } from 'styled-components'
import { rgba } from 'polished'
import useTheme from 'hooks/useTheme'
import { useMedia, useSize } from 'react-use'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import Pagination from 'components/Pagination'
import { CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE } from 'constants/index'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import {
  useSelectedCampaignLeaderboardLookupAddressManager,
  useSelectedCampaignLeaderboardPageNumberManager,
} from 'state/campaigns/hooks'

const leaderboardTableBodyBackgroundColorsByRank: { [p: string]: string } = {
  1: `linear-gradient(90deg, rgba(255, 204, 102, 0.25) 0%, rgba(255, 204, 102, 0) 54.69%, rgba(255, 204, 102, 0) 100%)`,
  2: `linear-gradient(90deg, rgba(224, 224, 224, 0.25) 0%, rgba(224, 224, 224, 0) 54.69%, rgba(224, 224, 224, 0) 100%)`,
  3: `linear-gradient(90deg, rgba(255, 152, 56, 0.25) 0%, rgba(255, 152, 56, 0) 54.69%, rgba(255, 152, 56, 0) 100%)`,
}

export default function LeaderboardLayout({ refreshIn }: { refreshIn: number }) {
  const above1200 = useMedia('(min-width: 1200px)')
  const theme = useTheme()
  const [rank, { width: rankWidth }] = useSize(() => (
    <span>
      <Trans>Rank</Trans>
    </span>
  ))

  const selectedCampaignLeaderboard = useSelector((state: AppState) => state.campaigns.selectedCampaignLeaderboard)

  const [currentPage, setCurrentPage] = useSelectedCampaignLeaderboardPageNumberManager()
  const [searchValue, setSearchValue] = useSelectedCampaignLeaderboardLookupAddressManager()

  const refreshInMinute = Math.floor(refreshIn / 60)
  const refreshInSecond = refreshIn - refreshInMinute * 60
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const showRewards = Boolean(selectedCampaign && selectedCampaign.isRewardShown)

  if (selectedCampaign === undefined || selectedCampaign.status === 'Upcoming')
    return (
      <div>
        <Trans>This campaign does not have a leaderboard yet.</Trans>
      </div>
    )

  return (
    <LeaderboardContainer>
      <RefreshTextAndSearchContainer>
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
        <Search
          placeholder={t`Search by full address`}
          searchValue={searchValue}
          onSearch={setSearchValue}
          style={{ background: theme.buttonBlack }}
        />
      </RefreshTextAndSearchContainer>
      <LeaderboardTable>
        <LeaderboardTableHeader showRewards={showRewards}>
          <LeaderboardTableHeaderItem>{rank}</LeaderboardTableHeaderItem>
          <LeaderboardTableHeaderItem>
            <Trans>Wallet</Trans>
          </LeaderboardTableHeaderItem>
          <LeaderboardTableHeaderItem align="right">
            <Trans>Points</Trans>
          </LeaderboardTableHeaderItem>
          {showRewards && (
            <LeaderboardTableHeaderItem align="right">
              <Trans>Rewards</Trans>
            </LeaderboardTableHeaderItem>
          )}
        </LeaderboardTableHeader>
        {(selectedCampaignLeaderboard?.ranking ?? []).map((data, index) => (
          <LeaderboardTableBody
            key={index}
            showRewards={showRewards}
            showMedal={data.rank <= 3}
            style={{
              background: leaderboardTableBodyBackgroundColorsByRank[data.rank.toString()] ?? 'transparent',
            }}
          >
            <LeaderboardTableBodyItem
              align="center"
              style={{ width: (rankWidth === Infinity ? 33 : rankWidth) + 'px', maxHeight: '24px' }}
            >
              {data.rank === 1 ? (
                <img src={Gold} style={{ minWidth: '18px' }} alt="" />
              ) : data.rank === 2 ? (
                <img src={Silver} style={{ minWidth: '18px' }} alt="" />
              ) : data.rank === 3 ? (
                <img src={Bronze} style={{ minWidth: '18px' }} alt="" />
              ) : data.rank !== undefined ? (
                data.rank
              ) : null}
            </LeaderboardTableBodyItem>
            <LeaderboardTableBodyItem>{getShortenAddress(data.address, above1200)}</LeaderboardTableBodyItem>
            <LeaderboardTableBodyItem align="right">
              {formatNumberWithPrecisionRange(data.point, 0, 2)}
            </LeaderboardTableBodyItem>
            {showRewards && (
              <LeaderboardTableBodyItem align="right">
                {/* TODO: Wait for backend refactoring. */}
                {/*{data.rewardAmount} {data.tokenSymbol}*/}
                {data.rewardAmount} KNC
              </LeaderboardTableBodyItem>
            )}
          </LeaderboardTableBody>
        ))}
      </LeaderboardTable>
      <Pagination
        onPageChange={pageNumber => setCurrentPage(pageNumber - 1)}
        totalCount={
          selectedCampaignLeaderboard ? (searchValue ? 1 : selectedCampaignLeaderboard.numberOfParticipants) : 0
        }
        currentPage={currentPage + 1}
        pageSize={CAMPAIGN_LEADERBOARD_ITEM_PER_PAGE}
        style={{ padding: '0' }}
      />
    </LeaderboardContainer>
  )
}

const LeaderboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const RefreshTextAndSearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
  ${css`
    flex-direction: column;
    gap: 16px;
  `}
  `}
`

const RefreshTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const RefreshText = styled.div`
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.disableText};
`

const CountdownContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: 12px;
  background: ${({ theme }) => rgba(theme.disableText, 0.1)};
  color: ${({ theme }) => theme.disableText};
`

const LeaderboardTable = styled.div``

const LeaderboardTableHeader = styled.div<{ showRewards: boolean }>`
  padding: 19px 20px;
  display: grid;
  align-items: center;
  background: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;

  ${({ showRewards }) =>
    showRewards
      ? css`
          grid-template-columns: 7.5fr 52.6fr 19.9fr 19.9fr;
        `
      : css`
          grid-template-columns: 7.5fr 52.6fr 39.8fr;
        `}

  ${({ theme, showRewards }) => theme.mediaWidth.upToMedium`
    ${
      showRewards
        ? css`
            grid-template-columns: 1fr 2fr 2fr 2fr;
          `
        : css`
            grid-template-columns: 1fr 2fr 1fr;
          `
    }
    }`}
  
  ${({ theme }) =>
    theme.mediaWidth.upToSmall`${css`
      padding: 16px;
    `}`}
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

const LeaderboardTableBodyItem = styled.div<{ align?: 'left' | 'right' | 'center' }>`
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: ${({ align }) => align ?? 'left'};

  ${({ theme }) =>
    theme.mediaWidth.upToMedium`${css`
      font-size: 12px;
      line-height: 14px;
      font-weight: 400;
    `}`}
`
