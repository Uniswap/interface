/* eslint-disable import/no-unused-modules */
/* eslint-disable react/prop-types */
import { Trans } from '@lingui/macro'
import { TokenPrice } from 'components/Tokens/TokenDetails/PriceChart'
import { createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'
import { formatDollar } from 'utils/formatNumbers'

const ChartHeader = styled.div`
  position: relative;
  ${textFadeIn};
  animation-duration: ${({ theme }) => theme.transition.duration.medium};
`

const MissingPrice = styled(TokenPrice)`
  font-size: 24px;
  line-height: 44px;
  color: ${({ theme }) => theme.textTertiary};
`

export default function ChartComponent({ tokenPriceQuery = [] }) {
  const data = tokenPriceQuery
  const backgroundColor = '#0b0a09'
  const textColor = 'white'

  const chartContainerRef = useRef()

  const chartAvailable = !!tokenPriceQuery && tokenPriceQuery.length > 0
  const missingPricesMessage = !chartAvailable ? (
    tokenPriceQuery.length === 0 ? (
      <>
        <Trans>Missing price data due to recently low trading volume on Uniswap v3</Trans>
      </>
    ) : (
      <Trans>Missing chart data</Trans>
    )
  ) : null

  const theme = useTheme()

  useEffect(() => {
    const handleResize = () => {}

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'rgba(200,200,200,0)' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#0B0C0C' },
        horzLines: { color: '#0B0C0C' },
      },
      width: 550,
      height: 350,
      leftPriceScale: {
        visible: true,
      },
      rightPriceScale: {
        visible: false,
      },
    })
    chart.priceScale().applyOptions({
      borderColor: '#ed4e33',
    })

    // Setting the border color for the horizontal axis
    chart.timeScale().applyOptions({
      timeVisible: true,
      borderColor: '#ed4e33',
    })
    chart.timeScale().fitContent()

    const newSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ed4e33',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ed4e33',
    })
    newSeries.setData(data.reverse())

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)

      chart.remove()
    }
  }, [data, backgroundColor, textColor])

  const headerData = data && data.length > 0 ? data[0].value : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <ChartHeader data-cy="chart-header">
        {data && data.length > 0 ? (
          <>
            <TokenPrice>{formatDollar({ num: headerData, isPrice: true })}</TokenPrice>
            {/* <DeltaContainer>
              {formattedDelta}
              <ArrowCell>{arrow}</ArrowCell>
            </DeltaContainer> */}
          </>
        ) : (
          <>
            <MissingPrice>Price Unavailable</MissingPrice>
            <ThemedText.Caption style={{ color: theme.textTertiary }}>{missingPricesMessage}</ThemedText.Caption>
          </>
        )}
      </ChartHeader>
      <div ref={chartContainerRef} />
    </div>
  )
}
