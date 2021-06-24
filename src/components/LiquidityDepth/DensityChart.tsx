import React, { useContext } from 'react'
import { VictoryArea, VictoryLine, VictoryBrushContainer, VictoryAxis, VictoryChart, VictoryLabel } from 'victory'
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
import { useDensityChartData, ChartEntry, ChartContext } from './hooks'
import { Bound } from 'state/mint/v3/actions'

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

export default function DensityChart({
  currencyA,
  currencyB,
  feeAmount,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
  atBounds,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: number
  price?: Price<Token, Token>
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
  atBounds: { [bound in Bound]?: boolean | undefined }
}) {
  const { zoom } = useContext(ChartContext)

  const theme = useTheme()

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const { loading, activeChartEntry, maxLiquidity, formattedData } = useDensityChartData({
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

  const filteredData =
    activeChartEntry && zoom
      ? formattedData?.slice(Math.max(0, activeChartEntry.index - zoom), activeChartEntry.index + zoom)
      : undefined

  return (
    <Wrapper>
      {/* filteredData === undefined will show sample data */}
      {filteredData === [] ? (
        <ColumnCenter>
          <XCircle stroke={theme.text4} />
          <TYPE.darkGray padding={10}>
            <Trans>No data</Trans>
          </TYPE.darkGray>
        </ColumnCenter>
      ) : (
        <VictoryChart
          height={275}
          padding={40}
          minDomain={{ y: 0 }}
          containerComponent={
            <VictoryBrushContainer
              allowDraw={false}
              allowDrag={interactive}
              allowResize={interactive}
              brushDimension="x"
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
                  leftLabel={
                    atBounds[Bound.LOWER]
                      ? '0'
                      : price && leftPrice
                      ? `${(
                          (parseFloat(leftPrice.toSignificant(5)) / parseFloat(price.toSignificant(5)) - 1) *
                          100
                        ).toFixed(2)}%`
                      : undefined
                  }
                  rightLabel={
                    atBounds[Bound.UPPER]
                      ? '∞'
                      : price && rightPrice
                      ? `${(
                          (parseFloat(rightPrice.toSignificant(5)) / parseFloat(price.toSignificant(5)) - 1) *
                          100
                        ).toFixed(2)}%`
                      : undefined
                  }
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
              handleWidth={30 /* handle width must be as large as handle head */}
            />
          }
        >
          <VictoryArea
            data={filteredData ? filteredData : sampleData}
            style={{ data: { stroke: theme.blue1, fill: theme.blue1, opacity: '0.5' } }}
            x={'price0'}
            y={'activeLiquidity'}
            interpolation="step"
          />

          {price && (
            <VictoryLine
              data={
                maxLiquidity && price
                  ? [
                      { x: parseFloat(price.toSignificant(5)), y: 0 },
                      { x: parseFloat(price.toSignificant(5)), y: parseFloat(maxLiquidity.toString()) },
                    ]
                  : []
              }
              labels={({ datum }) => (datum.y !== 0 ? price.toSignificant(5) : '')}
              labelComponent={
                <VictoryLabel
                  renderInPortal
                  dy={-10}
                  style={{ fill: theme.primaryText1, fontWeight: 500, fontSize: 15 }}
                />
              }
              style={{
                data: { stroke: theme.text1, opacity: '0.5' },
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
