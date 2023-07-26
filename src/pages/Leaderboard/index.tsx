import { Trans } from '@lingui/macro'
import LeaderboardTable from 'components/Leaderboard/LeaderBoardTable'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
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

export function LeaderBoard() {
  return (
    <LeaderBoardLayout id="contest-page">
      <TitleContainer>
        <MouseoverTooltip
          text={<Trans>This table contains the leader board with ranking and volume.</Trans>}
          placement="bottom"
        >
          <ThemedText.LargeHeader>
            <Trans>Leaderboard Pegasys</Trans>
          </ThemedText.LargeHeader>
        </MouseoverTooltip>
      </TitleContainer>
      <LeaderboardTable />
      {/* <Box width='100%' mb={3}>
        <Box className='flex items-center justify-between filter-options-wrapper'>
          <Box
            my={4}
            px={0}
            className='flex flex-wrap items-center pair-options'
          >
            {ContestPairs[chainId || ChainId.MATIC].map((pair: any) => {
              return (
                <Box
                  key={pair.address}
                  className={`topTab ${contestFilter.address === pair.address &&
                    'selectedTab'}`}
                  onClick={() => setContestFilter(pair)}
                >
                  <p className='weight-600'>{pair.name}</p>
                </Box>
              );
            })}
          </Box>

          <Box className='searchWidgetWrapper'>
            <Box className='searchWidgetInput'>
              <input
                placeholder={t('searchAddress')}
                value={searchValInput}
                onChange={(evt) => setSearchValInput(evt.target.value)}
              />
              <Box display='flex'>
                <SearchIcon />
              </Box>
            </Box>
          </Box>
        </Box>

        {searchVal && (
          <>
            <Box className='bg-palette topMoversWrapper' my={4}>
              <p className='weight-600 text-secondary'>{t('searchResult')}</p>
              {!searchLoading && searchResult ? (
                <>
                  <Box className='topMoversContent'>
                    <Box className='flex items-center' mt={2}>
                      {searchCardColumns.map((column) => {
                        return (
                          <Box
                            width={column.width}
                            key={column.key}
                            className='flex items-center cursor-pointer'
                            justifyContent={column.align}
                          >
                            <small className={'text-secondary'}>
                              {column.label}
                            </small>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                  <Box className='topMoversContent'>
                    <Box className='flex items-center'>
                      <Box width={0.1} textAlign='start'>
                        <small>{searchResult.rank}</small>
                      </Box>

                      <Box width={0.4} textAlign='center'>
                        <small>
                          {searchedEnsName
                            ? searchedEnsName
                            : isMobile
                            ? shortenAddress(searchResult['origin'])
                            : searchResult['origin']}
                        </small>
                      </Box>
                      <Box width={0.2} textAlign='center'>
                        <small>{searchResult['txCount']}</small>
                      </Box>

                      <Box width={0.3} textAlign='end' className='text-success'>
                        <small>{formatNumber(searchResult['amountUSD'])}</small>
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box my={2} textAlign={'center'} width={1}>
                  <Skeleton variant='rect' width='100%' height={60} />
                </Box>
              )}
            </Box>
          </>
        )}

        <Box className='panel'>
          <Box className='flex justify-end' mb={2}>
            <ChartType
              typeTexts={LeaderBoardAnalytics.CHART_DURATION_TEXTS}
              chartTypes={LeaderBoardAnalytics.CHART_DURATIONS}
              chartType={durationIndex}
              setChartType={setDurationIndex}
            />
          </Box>

          {!loading ? (
            <>
              {error ? (
                <p className='text-center weight-600'>{error}</p>
              ) : (
                <ContestTable data={contestLeaderBoard} />
              )}
            </>
          ) : (
            <Skeleton variant='rect' width='100%' height={150} />
          )}
        </Box>
      </Box>  */}
    </LeaderBoardLayout>
  )
}
