// import { JSBI, Pair } from '@teleswap/sdk'
// import dayjs from 'dayjs'
import { Pair /* , JSBI */ /*  , Token  */ } from '@teleswap/sdk'
import Bn from 'bignumber.js'
import DoubleCurrencyLogoHorizontal from 'components/DoubleLogo'
import { LiquidityCard } from 'components/PositionCard'
// import { BIG_INT_ZERO } from 'constants/index'
import gql from 'graphql-tag'
import useThemedContext from 'hooks/useThemedContext'
import namor from 'namor'
import React, { useEffect, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from 'rebass'
// import { useStakingInfo } from 'state/stake/hooks'
import styled from 'styled-components'
import { client } from 'utils/apolloClient'

import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { DataCard } from '../../components/earn/styled'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { RowBetween, RowFixed } from '../../components/Row'
import { Dots } from '../../components/swap/styleds'
import { usePairs } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { /* StyledInternalLink, */ TYPE } from '../../theme'

const PageWrapper = styled(AutoColumn)`
  max-width: 1132px;
  width: 40rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
  .YourLiquidityText {
    justify-self: flex-start;
    font-family: 'Dela Gothic One';
    font-weight: '400';
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
  line-height: 1.5rem;
  padding: 0.3rem 1.3rem;
  text-align: center;
  border-radius: 0.5rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
      font-weight: 500;
      font-size: .9rem;
      color: #000000;
      padding: 0;
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
  // border: 1px solid ${({ theme }) => theme.text4};
  background-color: rgba(25, 36, 47, 1);
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const YourLiquidityGrid = styled(Box)`
  // border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  background-color: rgba(25, 36, 47, 1);
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 0.7fr 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: repeat(40px);
  grid-row-gap: 1rem;
  grid-column-gap: ${() => (isMobile ? '30px' : '1rem')};
  grid-auto-flow: row;
  justify-items: flex-start;
  align-items: center;
  place-content: center center;
  > div {
    width: max-content;
  }
`

const TopPoolsGrid = styled(Box)`
  // border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  font-size: 0.8rem;
  background-color: rgba(25, 36, 47, 1);
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 5fr 2.5fr 5fr 4fr;
  grid-template-rows: repeat(40px);
  grid-row-gap: 1rem;
  grid-column-gap: ${() => (isMobile ? '0px' : '0.75rem')};
  grid-auto-flow: row;
  justify-items: flex-start;
  align-items: center;
  place-content: center center;
`

const HeaderItem = styled(Box).attrs((props) => {
  return {
    ...props,
    className: Array.isArray(props.className)
      ? [...props.className, 'text-detail']
      : props.className
      ? [props.className, 'text-detail']
      : ['text-detail']
  }
})`
  font-family: 'Poppins';
  font-style: normal;
  font-weight: 400;
  line-height: 0.8rem;
  font-size: 0.8rem;
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
  display: grid;
  grid-
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
        font-size: 0.8rem;
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
      font-size: 0.8rem;
      margin-bottom: 0.6rem;
      > td {
        overflow: hidden;
        font-weight: 500;
        font-size: 0.7rem;
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

const StyledLink = styled(ButtonPrimary)`
  & {
    display: inline-block !important;
    padding: 0.3rem;
    border-radius: 0.7rem !important;
    color: #000000;
  }
`
export default function Liquidity() {
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
  const [pools, setPools] = useState<any[]>([])
  const [ethPrice, setEthPrice] = useState<Bn>()

  useEffect(() => {
    ;(async () => {
      const {
        data: {
          bundles: [{ ethPrice }]
        }
      } = await client.query({
        query: gql`
          {
            bundles(first: 1) {
              id
              ethPrice
            }
          }
        `,
        fetchPolicy: 'cache-first'
      })
      setEthPrice(new Bn(ethPrice))
      const {
        data: { pairs: pairsData }
      } = await client.query({
        query: gql`
          {
            pairs(first: 5, orderBy: trackedReserveETH, orderDirection: desc) {
              id
              trackedReserveETH
              token0 {
                decimals
                id
                symbol
                name
                derivedETH
              }
              token1 {
                decimals
                id
                symbol
                name
                derivedETH
              }
              reserve0
              stable
              reserve1
              reserveUSD
              totalSupply
              trackedReserveETH
              reserveETH
              volumeUSD
              untrackedVolumeUSD
              token0Price
              token1Price
              createdAtTimestamp
            }
          }
        `,
        /*  variables: {
          allPairs: pairs.map((pair) => {
            return pair.id
          })
        }, */
        fetchPolicy: 'cache-first'
      })
      setPools(pairsData)
      /*   fetch('https://graph-goerli.qa.davionlabs.com/subgraphs/name/gop_subgraph', {
      headers: {
        accept: 'application/json',
        'accept-language': 'zh-CN,zh-TW;q=0.9,zh;q=0.8,en-US;q=0.7,en;q=0.6',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        pragma: 'no-cache',
        'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
      },
      referrer:
        'https://graph-goerli.qa.davionlabs.com/subgraphs/name/gop_subgraph/graphql?query=%7B%0A%20%20pairs(first%3A%2050%2C%20orderBy%3A%20trackedReserveETH%2C%20orderDirection%3A%20desc)%20%7B%0A%20%20%20%20id%0A%20%20%20%20trackedReserveETH%0A%20%20%20%20token0%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20symbol%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%20%20token1%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20symbol%0A%20%20%20%20%20%20name%0A%20%20%20%20%7D%0A%20%20%20%20reserve0%0A%20%20%20%20reserve1%0A%20%20%20%20reserveUSD%0A%20%20%20%20totalSupply%0A%20%20%20%20trackedReserveETH%0A%20%20%20%20reserveETH%0A%20%20%20%20volumeUSD%0A%20%20%20%20untrackedVolumeUSD%0A%20%20%20%20token0Price%0A%20%20%20%20token1Price%0A%20%20%20%20createdAtTimestamp%0A%20%20%7D%0A%7D',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: '{"query":"{\\n  pairs(first: 50, orderBy: trackedReserveETH, orderDirection: desc) {\\n    id\\n    trackedReserveETH\\n    token0 {\\n      id\\n      symbol\\n      name\\n    }\\n    token1 {\\n      id\\n      symbol\\n      name\\n    }\\n    reserve0\\n    reserve1\\n    reserveUSD\\n    totalSupply\\n    trackedReserveETH\\n    reserveETH\\n    volumeUSD\\n    untrackedVolumeUSD\\n    token0Price\\n    token1Price\\n    createdAtTimestamp\\n  }\\n}","variables":null,"operationName":null}',
      method: 'POST',
      mode: 'cors',
      credentials: 'include'
    }).then((res) => {
      console.log(res)
    }) */
    })()
  }, [])

  return (
    <>
      <PageWrapper
        sx={{
          button: {
            fontWeight: '600'
          },
          a: {
            fontWeight: '600'
          }
        }}
      >
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
              <TYPE.mediumHeader className="YourLiquidityText title">Your liquidity</TYPE.mediumHeader>
              {/* </HideSmall> */}
              <ButtonRow>
                {/* <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/create/ETH">
                  Create a pair
                </ResponsiveButtonSecondary> */}
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/ETH">
                  <Text className="AddLiquidity text-small" sx={{ fontWeight: 600, color: '#000000' }}>
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
            ) : v2IsLoading || !ethPrice ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allV2PairsWithLiquidity?.length > 0 && ethPrice !== undefined ? (
              //  || stakingPairs?.length > 0
              <>
                <YourLiquidityGrid className="text">
                  <HeaderItem>Pool</HeaderItem>
                  <HeaderItem>Pair Mode</HeaderItem>
                  <HeaderItem>Token</HeaderItem>
                  <HeaderItem>Amount</HeaderItem>
                  <HeaderItem>Value</HeaderItem>
                  <HeaderItem></HeaderItem>
                  {allV2PairsWithLiquidity.map((v2Pair, index) => (
                    <LiquidityCard
                      key={index}
                      pair={v2Pair}
                      needBgColor={false}
                      // stakedBalance={stakingInfosWithBalance[index].stakedAmount}
                      border={`1px solid rgba(255, 255, 255, 0.2)!important`}
                      borderRadius={`24px`}
                      ethPrice={ethPrice}
                    ></LiquidityCard>
                  ))}
                </YourLiquidityGrid>

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
                {/* {stakingPairs.map(
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
                )} */}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found
                </TYPE.body>
              </EmptyProposals>
            )}
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              {/* <HideSmall> */}
              <TYPE.mediumHeader
                className="title"
                style={{
                  justifySelf: 'flex-start',
                  fontFamily: 'Dela Gothic One',
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
            {/*  <HeaderItem>#</HeaderItem>
              <HeaderItem>Pools</HeaderItem>
              <HeaderItem>TVL</HeaderItem>
              <HeaderItem></HeaderItem> */}
            <TopPoolsGrid className="text">
              <HeaderItem>#</HeaderItem>
              <HeaderItem>Pools</HeaderItem>
              <HeaderItem>Pair Mode</HeaderItem>
              <HeaderItem>TVL</HeaderItem>
              <HeaderItem></HeaderItem>
              {pools.map((v2Pair, index) => {
                return <TopPairRow v2Pair={v2Pair} key={v2Pair.id} index={index} ethPrice={ethPrice} />
              })}
            </TopPoolsGrid>
            {/*  <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                {`Don't see a pool you joined?`}&nbsp;
                <StyledInternalLink id="import-pool-link" to="/find">
                  Import it.
                </StyledInternalLink>
              </Text>
            </AutoColumn> */}
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

function TopPairRow({ v2Pair, index, ethPrice }: { v2Pair: any; index: number; ethPrice?: Bn }) {
  return (
    <>
      <Box key={`${v2Pair.id}-1`}>{index + 1}</Box>
      <Box
        key={`${v2Pair.id}-2`}
        sx={{ textAlign: 'center', width: '10rem', display: 'flex', justifyContent: 'flex-start' }}
      >
        <Flex sx={{ gap: isMobile ? '0.25rem' : '0.25rem', width: '8rem' }}>
          <DoubleCurrencyLogoHorizontal currency0={v2Pair.token0} currency1={v2Pair.token1} />
          <Text
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: 'min-content',
              minWidth: isMobile ? '7rem' : 'min-content',
              textAlign: 'left'
            }}
          >
            {v2Pair.token0?.symbol?.toUpperCase()}-{v2Pair.token1?.symbol?.toUpperCase()}
          </Text>
        </Flex>
      </Box>
      <Box key={`${v2Pair.id}-3`}>{v2Pair.stable ? 'Stable' : 'Volatile'}</Box>
      <Box key={`${v2Pair.id}-3`}>
        {ethPrice
          ? new Bn(v2Pair.trackedReserveETH).multipliedBy(ethPrice).decimalPlaces(4, Bn.ROUND_HALF_UP).toString()
          : '-'}
        &nbsp; $
      </Box>
      <Box
        key={`${v2Pair.id}-4`}
        sx={{ display: 'flex', justifyContent: 'flex-end', width: 'max-content', justifySelf: 'end' }}
      >
        {/*    <ButtonPrimary
      className="text-small"
      style={{ display: 'inline-block !important', whiteSpace: 'nowrap' }}
      padding=".3rem"
      borderRadius=".5rem"
      as={Link}
      to={`/add/${v2Pair.token0.id}/${v2Pair.token1.id}`}
    >
      Provide Liquidity
    </ButtonPrimary> */}
        <StyledLink as={Link} to={`/add/${v2Pair.token0.id}/${v2Pair.token1.id}/${v2Pair.stable}`}>
          Provide Liquidity
        </StyledLink>
      </Box>
    </>
  )
}

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
