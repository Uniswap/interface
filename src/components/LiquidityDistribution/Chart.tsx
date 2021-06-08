import React from 'react'
import { VictoryBar, VictoryBrushContainer, VictoryAxis, VictoryChart } from 'victory'
import useTheme from 'hooks/useTheme'
import { Token } from '@uniswap/sdk-core'
import { useColor } from 'hooks/useColor'
import Brush from './Brush'

const sampleData = [
  { x: 0, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 6 },
  { x: 4, y: 5 },
  { x: 5, y: 7 },
  { x: 6, y: 3 },
  { x: 7, y: 1 },
]

export default function LiquidityDistributionChart({
  tokenA,
  tokenB,
  data,
}: {
  tokenA: Token | undefined
  tokenB: Token | undefined
  data?: { x: number; y: number }[]
}) {
  const theme = useTheme()
  const tokenAColor = useColor(tokenA)
  const tokenBColor = useColor(tokenB)

  return (
    <VictoryChart
      containerComponent={
        <VictoryBrushContainer
          allowDraw={false}
          brushDimension="x"
          brushComponent={
            <Brush
              leftHandleColor={tokenA ? tokenAColor : '#607BEE'}
              rightHandleColor={tokenB ? tokenBColor : '#F3B71E'}
            />
          }
          handleWidth={40}
          onBrushDomainChangeEnd={(domain) => {
            // throttle user input
            // use price instead of tick
            //if (Math.random() < 0.8) return
          }}
        />
      }
    >
      <VictoryBar
        data={data ?? sampleData}
        style={{ data: { stroke: theme.blue1, fill: theme.blue1, opacity: '0.2' } }}
      />

      <VictoryAxis
        padding={20}
        fixLabelOverlap={true}
        style={{
          tickLabels: {
            fill: theme.white,
            opacity: '0.6',
          },
        }}
      />
    </VictoryChart>
  )
}
