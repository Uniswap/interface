import React, { useMemo, useState } from 'react'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DarkBlueCard } from 'components/Card'
import DensityChart from './DensityChart'
import { RowBetween } from 'components/Row'
import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { ChartContext } from './hooks'
import ZoomButtons from './ZoomButtons'

const MIN_ZOOM = 10
const MAX_ZOOM = 200
const ZOOM_INCREMENT = 20

export default function LiquidityDepth({
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
  feeAmount: FeeAmount | undefined
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const [zoom, setZoom] = useState(60)

  const [canZoomIn, canZoomOut, zoomIn, zoomOut] = useMemo(
    () => [
      zoom > MIN_ZOOM,
      zoom < MAX_ZOOM,
      () => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_INCREMENT)),
      () => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_INCREMENT)),
    ],
    [zoom]
  )

  return (
    <ChartContext.Provider value={{ zoom, canZoomIn, canZoomOut, zoomIn, zoomOut }}>
      <DarkBlueCard>
        <AutoColumn>
          {/* <RowBetween>
            <Trans>Liquidity Distribution</Trans>
            <ZoomButtons />
          </RowBetween> */}
          <DensityChart
            price={price}
            currencyA={currencyA}
            currencyB={currencyB}
            feeAmount={feeAmount}
            priceLower={priceLower}
            priceUpper={priceUpper}
            onLeftRangeInput={onLeftRangeInput}
            onRightRangeInput={onRightRangeInput}
            interactive={interactive}
          />
        </AutoColumn>
      </DarkBlueCard>
    </ChartContext.Provider>
  )
}
