import { Token } from '@uniswap/sdk-core'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader from 'components/Loader'
import { LoadingRows } from 'components/Loader/styled'
import { RowFixed } from 'components/Row'
import { Arrow, Break, PageButtons } from 'components/shared'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { SupportedChainId } from 'constants/chains'
import { USDC_TEVMOS, WETH_TEVMOS } from 'constants/tokens'
import { useIsMobile } from 'nft/hooks'
import numbro from 'numbro'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { darkTheme } from 'theme/colors'

const GreyBadge = styled(Card)`
  width: fit-content;
  border-radius: 8px;
  background: ${darkTheme.backgroundModule};
  color: ${darkTheme.textPrimary};
  padding: 4px 6px;
  font-weight: 400;
`

const DarkGreyCard = styled(Card)`
  background-color: ${darkTheme.background};
`

const formatDollarAmount = (num: number | undefined, digits = 2, round = true) => {
  if (num === 0) return '$0.00'
  if (!num) return '-'
  if (num < 0.001 && digits <= 3) {
    return '<$0.001'
  }

  return numbro(num).formatCurrency({
    average: round,
    mantissa: num > 1000 ? 2 : digits,
    abbreviations: {
      million: 'M',
      billion: 'B',
    },
  })
}

const TextWrapper = styled(Text)<{ color: string; fontSize: number; fontWeight: number }>`
  color: ${({ color, theme }) => (theme as any)[color]};
`

function feeTierPercent(fee: number): string {
  return (fee / 10000).toPrecision(1) + '%'
}

const Label = styled.div<{ end?: number; color?: string }>`
  display: flex;
  font-size: 16px;
  font-weight: 400;
  justify-content: ${({ end }) => (end ? 'flex-end' : 'flex-start')};
  align-items: center;
  font-variant-numeric: tabular-nums;
  @media screen and (max-width: 640px) {
    font-size: 14px;
  }
  color: ${({ color }) => (color ? color : '#ffffff')};
`

const ClickableText = styled(Label)`
  text-align: end;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  @media screen and (max-width: 640px) {
    font-size: 12px;
  }
`

export interface PoolData {
  // basic token info
  address: string
  feeTier: number

  token0: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
}

const Wrapper = styled(DarkGreyCard)`
  width: 100%;
`

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 20px 3.5fr repeat(3, 1fr);

  @media screen and (max-width: 900px) {
    grid-template-columns: 20px 1.5fr repeat(2, 1fr);
    & :nth-child(3) {
      display: none;
    }
  }

  @media screen and (max-width: 500px) {
    grid-template-columns: 20px 1.5fr repeat(1, 1fr);
    & :nth-child(5) {
      display: none;
    }
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: 2.5fr repeat(1, 1fr);
    > *:nth-child(1) {
      display: none;
    }
  }
`

const LinkWrapper = styled(Link)`
  text-decoration: none;
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const SORT_FIELD = {
  feeTier: 'feeTier',
  volumeUSD: 'volumeUSD',
  tvlUSD: 'tvlUSD',
  volumeUSDWeek: 'volumeUSDWeek',
}

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const DataRow = ({ poolData, index }: { poolData: PoolData; index: number }) => {
  const isMobile = useIsMobile()
  let currency0
  let currency1
  if (poolData?.token1?.address?.toLowerCase() === WETH_TEVMOS?.address?.toLowerCase()) {
    currency1 = WETH_TEVMOS
  } else {
    currency1 = new Token(
      SupportedChainId.TESTNET,
      poolData.token1.address,
      poolData.token1.decimals,
      poolData.token1.symbol
    )
  }
  if (poolData?.token0?.address?.toLowerCase() === WETH_TEVMOS?.address?.toLowerCase()) {
    currency0 = WETH_TEVMOS
  } else {
    currency0 = new Token(
      SupportedChainId.TESTNET,
      poolData.token0.address,
      poolData.token0.decimals,
      poolData.token0.symbol
    )
  }

  if (poolData?.token1?.address?.toLowerCase() === USDC_TEVMOS?.address?.toLowerCase()) {
    currency1 = USDC_TEVMOS
  } else if (poolData?.token1?.address?.toLowerCase() !== WETH_TEVMOS?.address?.toLowerCase()) {
    currency1 = new Token(
      SupportedChainId.TESTNET,
      poolData.token1.address,
      poolData.token1.decimals,
      poolData.token1.symbol
    )
  }
  if (poolData?.token0?.address?.toLowerCase() === USDC_TEVMOS?.address?.toLowerCase()) {
    currency0 = USDC_TEVMOS
  } else if (poolData?.token0?.address?.toLowerCase() !== WETH_TEVMOS?.address?.toLowerCase()) {
    currency0 = new Token(
      SupportedChainId.TESTNET,
      poolData.token0.address,
      poolData.token0.decimals,
      poolData.token0.symbol
    )
  }

  return (
    <LinkWrapper to={'/add/' + poolData.token0.address + '/' + poolData.token1.address}>
      <ResponsiveGrid>
        <Label color="#ffffff">{index + 1}</Label>
        <Label>
          <RowFixed>
            <DoubleCurrencyLogo size={20} currency0={currency0} currency1={currency1} />
            <span style={{ marginLeft: '8px' }}>
              {currency0.symbol}/{currency1.symbol}
            </span>
            <GreyBadge ml="10px" fontSize="14px">
              {feeTierPercent(poolData.feeTier)}
            </GreyBadge>
          </RowFixed>
        </Label>
        {!isMobile && <Label end={1}>{formatDollarAmount(poolData.tvlUSD)}</Label>}
        <Label end={1}>{formatDollarAmount(poolData.volumeUSD)}</Label>
        {!isMobile && <Label end={1}>{formatDollarAmount(poolData.volumeUSDWeek)}</Label>}
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const MAX_ITEMS = 10

export default function PoolTable({ poolDatas, maxItems = MAX_ITEMS }: { poolDatas: PoolData[]; maxItems?: number }) {
  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.tvlUSD)
  const [sortDirection, setSortDirection] = useState<boolean>(true)
  const isMobile = useIsMobile()

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (poolDatas.length % maxItems === 0) {
      extraPages = 0
    }
    setMaxPage(Math.floor(poolDatas.length / maxItems) + extraPages)
  }, [maxItems, poolDatas])

  const sortedPools = useMemo(() => {
    return poolDatas
      ? poolDatas
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof PoolData] > b[sortField as keyof PoolData]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [maxItems, page, poolDatas, sortDirection, sortField])

  const handleSort = useCallback(
    (newField: string) => {
      setSortField(newField)
      setSortDirection(sortField !== newField ? true : !sortDirection)
    },
    [sortDirection, sortField]
  )

  const arrow = useCallback(
    (field: string) => {
      return sortField === field ? (!sortDirection ? '↑' : '↓') : ''
    },
    [sortDirection, sortField]
  )

  if (!poolDatas) {
    return <Loader />
  }

  return (
    <GridContainer>
      <Wrapper>
        {sortedPools.length > 0 ? (
          <AutoColumn gap="16px">
            <ResponsiveGrid>
              <Label color={darkTheme.textQuaternary}>#</Label>
              <ClickableText color={darkTheme.textQuaternary} onClick={() => handleSort(SORT_FIELD.feeTier)}>
                Pool {arrow(SORT_FIELD.feeTier)}
              </ClickableText>
              {!isMobile && (
                <ClickableText color={darkTheme.textQuaternary} end={1} onClick={() => handleSort(SORT_FIELD.tvlUSD)}>
                  TVL {arrow(SORT_FIELD.tvlUSD)}
                </ClickableText>
              )}
              <ClickableText color={darkTheme.textQuaternary} end={1} onClick={() => handleSort(SORT_FIELD.volumeUSD)}>
                Volume 24H {arrow(SORT_FIELD.volumeUSD)}
              </ClickableText>
              {!isMobile && (
                <ClickableText
                  color={darkTheme.textQuaternary}
                  end={1}
                  onClick={() => handleSort(SORT_FIELD.volumeUSDWeek)}
                >
                  Volume 7D {arrow(SORT_FIELD.volumeUSDWeek)}
                </ClickableText>
              )}
            </ResponsiveGrid>
            <Break />
            {sortedPools.map((poolData, i) => {
              if (poolData) {
                return (
                  <React.Fragment key={i}>
                    <DataRow index={(page - 1) * MAX_ITEMS + i} poolData={poolData} />
                    <Break />
                  </React.Fragment>
                )
              }
              return null
            })}
            <PageButtons>
              <div
                onClick={() => {
                  setPage(page === 1 ? page : page - 1)
                }}
              >
                <Arrow faded={page === 1 ? true : false}>←</Arrow>
              </div>

              <TextWrapper fontWeight={400} fontSize={16} color="text1">
                {'Page ' + page + ' of ' + maxPage}
              </TextWrapper>
              <div
                onClick={() => {
                  setPage(page === maxPage ? page : page + 1)
                }}
              >
                <Arrow faded={page === maxPage ? true : false}>→</Arrow>
              </div>
            </PageButtons>
          </AutoColumn>
        ) : (
          <LoadingRows>
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </LoadingRows>
        )}
      </Wrapper>
    </GridContainer>
  )
}
