import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import useGetLeaderboardGrantProgram, { RankByParam } from 'hooks/campaigns/useGetLeaderboardGrantProgram'
import useTheme from 'hooks/useTheme'
import { ProjectRanking } from 'types/grantProgram'
import { formattedNumLong } from 'utils'

import { HeaderText } from '../../styleds'
import LeaderBoard from './LeaderBoard'
import RefreshTimer from './RefreshTimer'
import Trophy from './Trophy'
import {
  LoaderContainer as AbsoluteContainer,
  Container,
  RankByText,
  RankByWrapper,
  TableWrapper,
  UtilityBar,
} from './styleds'

const EmptyRankings: any[] = []

export const ITEMS_PER_PAGE = 5

export type RankByConfig = {
  extracter: (p: ProjectRanking) => string // used to extract the value
  param: RankByParam // used as param in GET request
  title: string
}

const rankByConfigs: RankByConfig[] = [
  {
    extracter: (p: ProjectRanking) => {
      return String(p.totalParticipants)
    },
    param: 'total_participants',
    title: t`Participants`,
  },
  {
    extracter: (p: ProjectRanking) => {
      return formattedNumLong(Number(p.totalVolume), true)
    },
    param: 'total_volume',
    title: t`Trading Volume`,
  },
  {
    extracter: (p: ProjectRanking) => {
      return String(p.totalTrades)
    },
    param: 'total_trades',
    title: t`Number of Trades`,
  },
]

type Props = {
  programId?: number
  showRefreshTimer?: boolean
}

const LeaderBoardSection: React.FC<Props> = ({ programId, showRefreshTimer }) => {
  const theme = useTheme()
  const [page, setPage] = useState(1)
  const [rankByConfig, setRankByConfig] = useState(rankByConfigs[0])
  const {
    swrData: { data, isValidating, error },
    refresh,
  } = useGetLeaderboardGrantProgram({
    id: programId,
    rankBy: rankByConfig.param,
    page,
    pageSize: ITEMS_PER_PAGE,
  })

  const renderLoading = () => {
    if (isValidating) {
      return (
        <AbsoluteContainer>
          <Loader />
        </AbsoluteContainer>
      )
    }

    if (error) {
      return (
        <AbsoluteContainer>
          <Text
            sx={{
              fontWeight: 400,
              fontSize: '16px',
              lineHeight: '16px',
              color: theme.text,
            }}
          >
            {JSON.stringify(error) || <Trans>Something went wrong</Trans>}
          </Text>
        </AbsoluteContainer>
      )
    }

    if (data?.totalItems === 0 || data?.rankings.length === 0) {
      return (
        <AbsoluteContainer>
          <Flex
            sx={{
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <Info color={theme.subText} />
            <Text
              sx={{
                fontWeight: 400,
                fontSize: '16px',
                lineHeight: '16px',
                color: theme.subText,
              }}
            >
              <Trans>Currently there are no Projects</Trans>
            </Text>
          </Flex>
        </AbsoluteContainer>
      )
    }

    return null
  }

  useEffect(() => {
    // reset page to 1 when user changes tab
    setPage(1)
  }, [rankByConfig])

  return (
    <Flex
      width="100%"
      flexDirection="column"
      alignItems="center"
      marginTop="160px"
      sx={{
        gap: '48px',
      }}
    >
      <HeaderText>
        <Trans>Projects Leaderboard</Trans>
      </HeaderText>

      <Flex
        sx={{
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <Trophy key={rankByConfig.param} rankByConfig={rankByConfig} programId={programId} />

        <Container>
          <RankByWrapper>
            {rankByConfigs.map(config => {
              return (
                <RankByText
                  key={config.param}
                  active={config.param === rankByConfig.param}
                  onClick={() => setRankByConfig(config)}
                >
                  {config.title}
                </RankByText>
              )
            })}
          </RankByWrapper>

          <TableWrapper>
            <UtilityBar>
              <RefreshTimer shouldCountDown={!!(programId && showRefreshTimer)} interval={5 * 60} callback={refresh} />
            </UtilityBar>
            <Flex
              sx={{
                position: 'relative',
                flexDirection: 'column',
              }}
            >
              <LeaderBoard
                rankings={data?.rankings || EmptyRankings}
                rankByConfig={rankByConfig}
                page={page}
                setPage={setPage}
                totalRankings={data?.totalItems || 0}
              />
              {renderLoading()}
            </Flex>
          </TableWrapper>
        </Container>
      </Flex>
    </Flex>
  )
}

export default LeaderBoardSection
