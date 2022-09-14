import { JSBI, Pair } from '@teleswap/sdk'
import useThemedContext from 'hooks/useThemedContext'
import namor from 'namor'
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Box, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { DataCard } from '../../components/earn/styled'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import FullPositionCard, { LiquidityCard } from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'
import { Dots } from '../../components/swap/styleds'
import { BIG_INT_ZERO } from '../../constants'
import { usePairs } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useStakingInfo } from '../../state/stake/hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE } from '../../theme'

const PageWrapper = styled(AutoColumn)`
  max-width: 1132px;
  width: 37.3rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
  .YourLiquidityText {
    justify-self: flex-start;
    font-family: 'Dela Gothic One';
    font-weight: '400';
    font-size: '.8rem';
    color: '#FFFFFF';
    ${({ theme }) => theme.mediaWidth.upToSmall`
      font-size: .9rem;
      color: #FFFFFF;
    `};
  }
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    // flex-direction: column-reverse;
    flex-direction: row;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    // width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  line-height: 1.33rem;
  border-radius: 0.3rem;
  padding: 0.3rem 1.3rem;
  text-align: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      font-weight: 500;
      font-size: .9rem;
      color: #000000;
      padding: 0;
      border-radius: .4rem;
      width: 8rem;
      height: 2.3rem
      line-height: 2.3rem;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const YourLiquidityGrid = styled(Box)`
  // border: 1px solid rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.2); //test usage
  border-radius: 24px;
  padding: 48px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: repeat(40px);
  grid-row-gap: 24px;
  grid-auto-flow: row;
  justify-items: center;
  align-items: center;
  place-content: center center;
`

const TopPoolsGrid = styled(Box)`
  // border: 1px solid rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.2); //test usage
  border-radius: 24px;
  padding: 48px;
  display: grid;
  grid-template-columns: 1fr 3fr 3fr 3fr;
  grid-template-rows: repeat(40px);
  grid-row-gap: 24px;
  grid-auto-flow: row;
  justify-items: center;
  align-items: center;
  place-content: center center;
`

const HeaderItem = styled(Box)`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
`
const TopPoolsStyled = styled(Box)`
  height: 300px;
  iframe {
    width: 100%;
    height: 700px;
    position: relative;
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
`

const StyledTableView = styled(Box)`
  /* height: 12rem; */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  box-sizing: border-box;
  padding: 1.6rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 1px;
  `};
  > thead {
    display: inline-block;
    width: 100%;
    margin-bottom: 0.6rem;
    > tr {
      display: flex;
      justify-content: center;
      align-items: center;

      > th {
        overflow: hidden;
        font-weight: 600;
        font-size: 0.4rem;
        color: rgba(255, 255, 255, 0.6);
        flex: 1;
        text-align: left;
        &:nth-of-type(2) {
          flex: 2;
        }
        &:nth-of-type(3) {
          flex: 3;
        }
        &:nth-of-type(5) {
          flex: 2;
        }
        &:nth-of-type(6) {
          flex: 2;
        }
      }
    }
  }
  > tbody {
    display: inline-block;
    width: 100%;
    max-height: 9rem;
    overflow: scroll;
    > tr {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.6rem;
      > td {
        overflow: hidden;
        font-weight: 500;
        font-size: 0.5rem;
        color: #ffffff;
        flex: 1;
        text-align: left;
        &:nth-of-type(2) {
          flex: 2;
        }
        &:nth-of-type(3) {
          flex: 3;
        }
        &:nth-of-type(5) {
          flex: 2;
        }
        &:nth-of-type(6) {
          flex: 2;
        }
      }
    }
  }
`

export default function Pool() {
  const theme = useThemedContext()
  const { account } = useActiveWeb3React()
  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // show liquidity even if its deposited in rewards contract
  const stakingInfo = useStakingInfo()
  const stakingInfosWithBalance = stakingInfo?.filter((pool) => JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
  const stakingPairs = usePairs(stakingInfosWithBalance?.map((stakingInfo) => stakingInfo.tokens))

  // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity.filter((v2Pair) => {
    return (
      stakingPairs
        ?.map((stakingPair) => stakingPair[1])
        .filter((stakingPair) => stakingPair?.liquidityToken.address === v2Pair.liquidityToken.address).length === 0
    )
  })

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        {/*   <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Liquidity provider rewards</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  {`Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.`}
                </TYPE.white>
              </RowBetween>
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                href="https://uniswap.org/docs/v2/core-concepts/pools/"
              >
                <TYPE.white fontSize={14}>Read more about providing liquidity</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard> */}

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              {/* <HideSmall> */}
              <TYPE.mediumHeader className="YourLiquidityText">Your liquidity</TYPE.mediumHeader>
              {/* </HideSmall> */}
              <ButtonRow>
                {/* <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/create/ETH">
                  Create a pair
                </ResponsiveButtonSecondary> */}
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                  <Text className="AddLiquidity" sx={{ fontWeight: 500, fontSize: '.5rem', color: '#000000' }}>
                    Add Liquidity
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </Card>
            ) : v2IsLoading ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allV2PairsWithLiquidity?.length > 0 || stakingPairs?.length > 0 ? (
              <>
                <StyledTableView>
                  <thead>
                    <tr>
                      <th>Pool</th>
                      <th>Token</th>
                      <th>Amount</th>
                      <th>Value</th>
                      {/* <th>Unclaimed Earnings</th> */}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {v2PairsWithoutStakedAmount.map((v2Pair, index) => (
                      <LiquidityCard
                        key={index}
                        pair={v2Pair}
                        needBgColor={false}
                        border={`1px solid rgba(255, 255, 255, 0.2)!important`}
                        borderRadius={`24px`}
                      ></LiquidityCard>
                    ))}
                  </tbody>
                </StyledTableView>

                {/* <ButtonSecondary>
                  <RowBetween>
                    <ExternalLink href={'https://uniswap.info/account/' + account}>
                      Account analytics and accrued fees
                    </ExternalLink>
                    <span> ↗</span>
                  </RowBetween>
                </ButtonSecondary> */}
                {/* {v2PairsWithoutStakedAmount.map((v2Pair) => (
                  <YourLiquidityGrid key={v2Pair.liquidityToken.address}>
                    <FullPositionCard
                      pair={v2Pair}
                      needBgColor={false}
                      border={`1px solid rgba(255, 255, 255, 0.2)!important`}
                      borderRadius={`24px`}
                    />
                  </YourLiquidityGrid>
                ))} */}
                {stakingPairs.map(
                  (stakingPair, i) =>
                    stakingPair[1] && ( // skip pairs that arent loaded
                      <FullPositionCard
                        key={stakingInfosWithBalance[i].stakingRewardAddress}
                        pair={stakingPair[1]}
                        needBgColor={false}
                        border={`1px solid rgba(255, 255, 255, 0.2)!important`}
                        borderRadius={`24px`}
                        stakedBalance={stakingInfosWithBalance[i].stakedAmount}
                      />
                    )
                )}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </EmptyProposals>
            )}
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              {/* <HideSmall> */}
              <TYPE.mediumHeader
                style={{
                  justifySelf: 'flex-start',
                  fontFamily: 'Dela Gothic One',
                  fontSize: '.8rem',
                  color: '#FFFFFF'
                }}
              >
                Top Pools
              </TYPE.mediumHeader>
              {/* </HideSmall> */}
            </TitleRow>
            {/* <TopPoolsStyled>
              <iframe src="https://info.uniswap.org/#/pools" height="600" width="1280" title="xxxx"></iframe>
            </TopPoolsStyled> */}
            <TopPoolsGrid>
              <HeaderItem>#</HeaderItem>
              <HeaderItem>Pools</HeaderItem>
              <HeaderItem>TVL</HeaderItem>
              <HeaderItem></HeaderItem>
              {}
            </TopPoolsGrid>
            <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                Don't see a pool you joined?{' '}
                <StyledInternalLink id="import-pool-link" to="/find">
                  Import it.
                </StyledInternalLink>
              </Text>
            </AutoColumn>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
/* 
function Table() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Pool',
        accessor: 'Pool'
      },
      {
        Header: 'Token',
        accessor: 'Token'
      },
      {
        Header: 'Amount',
        accessor: 'Amount'
      },
      {
        Header: 'Value',
        accessor: 'Value'
      },
      {
        Header: 'Unclaimed Earnings',
        accessor: 'Unclaimed Earnings'
      }
    ],
    []
  )
  const data = React.useMemo(() => makeData(100000), [])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 2 }
    },
    usePagination
  )
  return (
    <Flex flexDirection={'column'}>
      <table {...getTableProps()} style={{ textAlign: 'center' }}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </Flex>
  )
} */

const range = (len) => {
  const arr: number[] = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const newPerson = () => {
  return {
    Pool: namor.generate({ words: 1, numbers: 0 }),
    Token: namor.generate({ words: 1, numbers: 0 }),
    Amount: Math.floor(Math.random() * 30),
    Value: Math.floor(Math.random() * 100),
    'Unclaimed Earnings': Math.floor(Math.random() * 100)
  }
}

function makeData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map((d) => {
      return {
        ...newPerson()
      }
    })
  }

  return makeDataLevel()
}
