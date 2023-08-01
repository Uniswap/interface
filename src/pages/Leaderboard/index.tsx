import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import LeaderboardTable from 'components/Leaderboard/LeaderBoardTable'
import { LeaderboardUserTable } from 'components/Leaderboard/LeaderBoardUserTable'
import SearchBar from 'components/Leaderboard/SearchBar'
import TimeSelector from 'components/Leaderboard/TimeSelector'
import { MAX_WIDTH_MEDIA_BREAKPOINT, MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const LeaderBoardLayout = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    order: 2;
  }
`

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SearchContainer = styled(FiltersContainer)`
  margin-left: 8px;
  width: 100%;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    margin: 0px;
    order: 1;
  }
`
const FiltersWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.textTertiary};
  flex-direction: row;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    flex-direction: column;
    gap: 8px;
  }
`

const LeaderBoardUserWrapper = styled.div`
  margin: 0 auto;
  margin-bottom: 20px;
`

export function LeaderBoard() {
  const { account } = useWeb3React()

  return (
    <LeaderBoardLayout id="contest-page">
      <TitleContainer>
        <MouseoverTooltip
          text={<Trans>This table contains the leader board with ranking and volume.</Trans>}
          placement="bottom"
        >
          <ThemedText.LargeHeader>
            <Trans>Leaderboard</Trans>
          </ThemedText.LargeHeader>
        </MouseoverTooltip>
      </TitleContainer>
      <LeaderBoardUserWrapper>{!!account && <LeaderboardUserTable address={account} />}</LeaderBoardUserWrapper>
      <FiltersWrapper>
        <FiltersContainer>
          <TimeSelector />
        </FiltersContainer>
        <SearchContainer>
          <SearchBar />
        </SearchContainer>
      </FiltersWrapper>
      <LeaderboardTable address={account ? account : undefined} />
    </LeaderBoardLayout>
  )
}
