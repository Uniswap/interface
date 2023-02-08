import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import { Bound } from 'state/mint/proamm/type'
import { formattedNum } from 'utils'
import { getTickToPrice } from 'utils/getTickToPrice'

import PriceVisualize from './PriceVisualize'

const TableWrapper = styled.div`
  margin-top: 1rem;
`

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 20px 1fr 1fr 1fr 1.5fr;
  padding: 16px 20px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.background};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  text-align: right;
`

const TableRow = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 20px 1fr 1fr 1fr 1.5fr;
  padding: 12px 16px;
  font-size: 14px;
  align-items: center;
  height: fit-content;
  position: relative;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  :last-child {
    border-bottom: none;
    border-bottom-right-radius: 20px;
    border-bottom-left-radius: 20px;
  }
`

const RowItem = styled(Flex)`
  flex-direction: column;
`

const PositionListItem = ({
  position,
  index,
  usdPrices,
  ticksAtLimit,
  rotated,
}: {
  position: Position
  index: number
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimit: {
    [bound in Bound]: boolean | undefined
  }
  rotated: boolean
}) => {
  const [tokenA, tokenB] = rotated
    ? [position.amount1.currency, position.amount0.currency]
    : [position.amount0.currency, position.amount1.currency]
  const usdValue =
    parseFloat(position.amount0.toSignificant(6)) * usdPrices[tokenA.address] +
    parseFloat(position.amount1.toSignificant(6)) * usdPrices[tokenB.address]
  const priceLower = getTickToPrice(tokenA, tokenB, position.tickLower)
  const priceUpper = getTickToPrice(tokenA, tokenB, position.tickUpper)
  if (!priceLower || !priceUpper) return null

  return (
    <TableRow>
      <RowItem>
        <Text>{index + 1}</Text>
      </RowItem>
      <RowItem>{formattedNum(usdValue.toString(), true)}</RowItem>
      <RowItem>
        <Flex sx={{ gap: '4px', alignItems: 'center' }}>
          <CurrencyLogo currency={position.amount0.currency} size={'16px'} />
          <Text>
            {position.amount0.toSignificant(4)} {position.amount0.currency.symbol}
          </Text>
        </Flex>
      </RowItem>
      <RowItem>
        <Flex sx={{ gap: '4px', alignItems: 'center' }}>
          <CurrencyLogo currency={position.amount1.currency} size={'16px'} />
          <Text>
            {position.amount1.toSignificant(4)} {position.amount1.currency.symbol}
          </Text>
        </Flex>
      </RowItem>
      <RowItem alignItems="flex-end" width="100%">
        <PriceVisualize
          priceLower={priceLower}
          priceUpper={priceUpper}
          price={rotated ? position.pool.token1Price : position.pool.token0Price}
          showTooltip={true}
          ticksAtLimit={ticksAtLimit}
        />
      </RowItem>
    </TableRow>
  )
}

const ChartPositions = ({
  positions,
  usdPrices,
  rotated,
  ticksAtLimits,
}: {
  positions: Position[]
  usdPrices: {
    [address: string]: number
  }
  ticksAtLimits: {
    [bound in Bound]: (boolean | undefined)[]
  }
  rotated: boolean
}) => {
  const [tokenA, tokenB] = rotated
    ? [positions[0].amount1.currency, positions[0].amount0.currency]
    : [positions[0].amount0.currency, positions[0].amount1.currency]

  const header = (
    <TableHeader>
      <RowItem alignItems="flex-start">
        <Text>#</Text>
      </RowItem>
      <RowItem alignItems="flex-start">
        <Trans>VALUE</Trans>
      </RowItem>

      <RowItem alignItems="flex-start">
        <Trans>{positions[0].amount0.currency.symbol}</Trans>
      </RowItem>

      <RowItem alignItems="flex-start">
        <Trans>{positions[0].amount1.currency.symbol}</Trans>
      </RowItem>

      <RowItem alignItems="flex-end">
        <Trans>
          PRICE RANGE ({tokenB.symbol} per {tokenA.symbol})
        </Trans>
      </RowItem>
    </TableHeader>
  )

  const body = positions.map((position, index) => {
    return (
      <PositionListItem
        key={index}
        position={position}
        index={index}
        usdPrices={usdPrices}
        rotated={rotated}
        ticksAtLimit={{
          [Bound.LOWER]: ticksAtLimits[Bound.LOWER][index],
          [Bound.UPPER]: ticksAtLimits[Bound.UPPER][index],
        }}
      />
    )
  })
  return (
    <TableWrapper>
      {header}
      {body}
    </TableWrapper>
  )
}

export default ChartPositions
