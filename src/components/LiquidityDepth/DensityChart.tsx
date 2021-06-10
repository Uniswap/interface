import React, { ReactChild, ReactNode } from 'react'
import { VictoryBar, VictoryLine, VictoryBrushContainer, VictoryAxis, VictoryChart, VictoryLabel } from 'victory'
import useTheme from 'hooks/useTheme'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { useColor } from 'hooks/useColor'
import { Brush } from './Brush'
import Loader from 'components/Loader'
import styled from 'styled-components'
import { Box } from 'rebass'
import { Trans } from '@lingui/macro'
import { XCircle } from 'react-feather'
import { TYPE } from '../../theme'
import { ColumnCenter } from 'components/Column'
import { useDensityChartData, ChartEntry } from './hooks'

const sampleData: Partial<ChartEntry>[] = [
  { price0: 0, activeLiquidity: 1 },
  { price0: 1, activeLiquidity: 2 },
  { price0: 2, activeLiquidity: 3 },
  { price0: 3, activeLiquidity: 6 },
  { price0: 4, activeLiquidity: 5 },
  { price0: 5, activeLiquidity: 3 },
  { price0: 6, activeLiquidity: 2 },
]

const Wrapper = styled(Box)`
  position: relative;
  height: 250px;

  display: grid;
  justify-content: center;
  align-content: center;
`

const SyncingIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
`

export default function DensityChart({
  price,
  currencyA,
  currencyB,
  feeAmount,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  price: string | undefined
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: number
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const { loading, syncing, priceAtActiveTick, maxLiquidity, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  if (loading) {
    return (
      <Wrapper>
        <Loader stroke={theme.text4} />
      </Wrapper>
    )
  }

  interactive = interactive && Boolean(formattedData?.length)

  return (
    <Wrapper>
      {syncing ? (
        <SyncingIndicator>
          <Loader stroke={theme.text4} />
        </SyncingIndicator>
      ) : null}

      {/* formatted === undefined will show sample data */}
      {formattedData === [] ? (
        <ColumnCenter>
          <XCircle stroke={theme.text4} />
          <TYPE.darkGray padding={10}>
            <Trans>No data</Trans>
          </TYPE.darkGray>
        </ColumnCenter>
      ) : (
        <VictoryChart
          animate={{ duration: 500, easing: 'cubic' }}
          height={275}
          padding={40}
          minDomain={{ y: 0 }}
          containerComponent={
            <VictoryBrushContainer
              allowDraw={false}
              allowDrag={interactive}
              allowResize={interactive}
              brushDimension="x"
              handleWidth={40 /* handle width must be as large as handle head */}
              brushDomain={
                leftPrice && rightPrice
                  ? {
                      x: [parseFloat(leftPrice?.toSignificant(5)), parseFloat(rightPrice?.toSignificant(5))],
                    }
                  : undefined
              }
              brushComponent={
                <Brush
                  leftHandleColor={currencyA ? tokenAColor : theme.primary1}
                  rightHandleColor={currencyB ? tokenBColor : theme.secondary1}
                  allowDrag={interactive}
                />
              }
              onBrushDomainChangeEnd={(domain) => {
                const leftRangeValue = Number(domain.x[0])
                const rightRangeValue = Number(domain.x[1])

                // simulate user input for auto-formatting and other validations
                leftRangeValue > 0 && onLeftRangeInput(leftRangeValue.toFixed(6))
                rightRangeValue > 0 && onRightRangeInput(rightRangeValue.toFixed(6))
              }}
            />
          }
        >
          <VictoryBar
            data={formattedData ? formattedData : sampleData}
            style={{ data: { stroke: theme.blue1, fill: theme.blue1, opacity: '0.5' } }}
            x={'price0'}
            y={'activeLiquidity'}
          />

          {price && (
            <VictoryLine
              data={
                /* plot at `priceAtActiveTick` to put on same axis as VictoryBar, but display `price` as label */
                maxLiquidity && priceAtActiveTick
                  ? [
                      { x: priceAtActiveTick, y: 0 },
                      { x: priceAtActiveTick, y: maxLiquidity },
                    ]
                  : []
              }
              labels={({ datum }) => (datum.y !== 0 ? price : '')}
              labelComponent={
                <VictoryLabel
                  renderInPortal
                  dy={-10}
                  style={{ fill: theme.primaryText1, fontWeight: 500, fontSize: 15 }}
                />
              }
              style={{
                data: { stroke: theme.secondary1 },
              }}
            />
          )}

          <VictoryAxis
            fixLabelOverlap={true}
            style={{
              tickLabels: {
                fill: theme.text1,
                opacity: '0.6',
              },
            }}
          />
        </VictoryChart>
      )}
    </Wrapper>
  )
}
