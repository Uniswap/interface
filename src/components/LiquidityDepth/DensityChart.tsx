import React, { useEffect, useState } from 'react'
import { VictoryBar, VictoryLine, VictoryBrushContainer, VictoryAxis, VictoryChart } from 'victory'
import useTheme from 'hooks/useTheme'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useColor } from 'hooks/useColor'
import Brush from './Brush'
import JSBI from 'jsbi'
import { usePoolTickData } from 'hooks/usePoolTickData'
import { TickProcessed } from 'constants/ticks'
import Loader from 'components/Loader'
import styled from 'styled-components'
import { Box } from 'rebass'

interface ChartEntry {
  index: number
  isCurrent: boolean
  activeLiquidity: number
  price0: number
  price1: number
}

const Wrapper = styled(Box)`
  position: relative;
  min-height: 150px;

  display: grid;
  justify-content: center;
  align-content: center;
`

const SyncingIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
`

function useDensityChartData({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount: FeeAmount | undefined
}) {
  const [formattedData, setFormattedData] = useState<ChartEntry[] | undefined>()
  const [currentPrice, setCurrentPrice] = useState<number | undefined>()
  const [maxLiquidity, setMaxLiquidity] = useState<number>(0)

  const { loading, syncing, error, valid, activeTick, tickData } = usePoolTickData(currencyA, currencyB, feeAmount)

  useEffect(() => {
    function formatData() {
      if (!tickData || !tickData.length) {
        return
      }

      const newData: ChartEntry[] = []
      let maxLiquidity = JSBI.BigInt(0)

      for (let i = 0; i < tickData.length; i++) {
        const t: TickProcessed = tickData[i]
        const active = t.tickIdx === activeTick

        maxLiquidity = JSBI.greaterThan(tickData[i].liquidityActive, maxLiquidity)
          ? tickData[i].liquidityActive
          : maxLiquidity

        const chartEntry = {
          index: i,
          isCurrent: active,
          activeLiquidity: parseFloat(t.liquidityActive.toString()),
          price0: parseFloat(t.price0),
          price1: parseFloat(t.price1),
        }

        if (active) {
          setCurrentPrice(chartEntry.price0)
        }

        newData.push(chartEntry)
      }

      setMaxLiquidity(parseFloat(maxLiquidity.toString()))

      if (newData) {
        setFormattedData(newData)
      }
    }

    if (!loading) {
      formatData()
    }
  }, [loading, activeTick, tickData])

  return {
    loading,
    syncing,
    error,
    currentPrice,
    maxLiquidity,
    formattedData,
  }
}

export default function DensityChart({
  currencyA,
  currencyB,
  feeAmount,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: number
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
}) {
  const theme = useTheme()

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const { loading, syncing, error, currentPrice, maxLiquidity, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  if (error) {
    console.error('ERROR')
  }

  if (loading) {
    return (
      <Wrapper>
        <Loader stroke={theme.text4} />
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {syncing ? (
        <SyncingIndicator>
          <Loader stroke={theme.text4} />
        </SyncingIndicator>
      ) : null}

      {formattedData?.length ? (
        <VictoryChart
          height={275}
          padding={40}
          containerComponent={
            //animate={{ duration: 500, easing: 'cubic' }}
            <VictoryBrushContainer
              brushDimension="x"
              brushDomain={
                leftPrice && rightPrice
                  ? {
                      x: [
                        parseFloat(leftPrice?.toSignificant(5) ?? '0'),
                        parseFloat(rightPrice?.toSignificant(5) ?? '4000'),
                      ],
                    }
                  : undefined
              }
              brushComponent={
                //allowDraw={false}
                <Brush
                  leftHandleColor={currencyA ? tokenAColor : '#607BEE'}
                  rightHandleColor={currencyB ? tokenBColor : '#F3B71E'}
                />
              }
              handleWidth={40}
              onBrushDomainChangeEnd={(domain) => {
                onLeftRangeInput(domain.x[0].toString())
                onRightRangeInput(domain.x[1].toString())
              }}
            />
          }
        >
          <VictoryBar
            data={formattedData}
            style={{ data: { stroke: theme.blue1, fill: theme.blue1, opacity: '0.2' } }}
            x={'price0'}
            y={'activeLiquidity'}
          />

          <VictoryLine
            data={
              maxLiquidity
                ? [
                    { x: currentPrice, y: 0 },
                    { x: currentPrice, y: maxLiquidity },
                  ]
                : undefined
            }
            style={{
              data: { stroke: theme.secondary1 },
            }}
          />

          <VictoryAxis
            padding={20}
            fixLabelOverlap={true}
            style={{
              tickLabels: {
                fill: theme.text1,
                opacity: '0.6',
              },
            }}
          />
        </VictoryChart>
      ) : (
        'No data!'
      )}
    </Wrapper>
  )
}
