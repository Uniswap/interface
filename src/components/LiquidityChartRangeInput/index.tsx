import React, { ReactNode, useCallback } from 'react'
import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { DarkBlueCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import Loader from 'components/Loader'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { saturate } from 'polished'
import { XCircle } from 'react-feather'
import { batch } from 'react-redux'
import { Box } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import { Chart } from './Chart'
import { useDensityChartData } from './hooks'
import Row, { RowBetween } from 'components/Row'

const Wrapper = styled(Box)`
  position: relative;
  height: 250px;

  display: grid;
  justify-content: center;
  align-content: center;
`

export default function LiquidityChartRangeInput({
  price,
  priceLabel,
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
  priceLabel: ReactNode | undefined
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

  const { loading, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const onBrushDomainChangeEnded = useCallback(
    (domain) => {
      const leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      batch(() => {
        // simulate user input for auto-formatting and other validations
        leftRangeValue > 0 && onLeftRangeInput(leftRangeValue.toFixed(6))
        rightRangeValue > 0 && onRightRangeInput(rightRangeValue.toFixed(6))
      })
    },
    [onLeftRangeInput, onRightRangeInput]
  )

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
    <DarkBlueCard>
      <AutoColumn gap="md">
        <RowBetween>
          <TYPE.label>
            <Trans>Liquidity Distribution</Trans>
          </TYPE.label>
        </RowBetween>

        <Row justifyItems="center">{priceLabel}</Row>

        <Wrapper>
          {formattedData === [] ? (
            <ColumnCenter>
              <XCircle stroke={theme.text4} />
              <TYPE.darkGray padding={10}>
                <Trans>No data</Trans>
              </TYPE.darkGray>
            </ColumnCenter>
          ) : (
            <>
              {!formattedData || !price ? (
                <div>Loading</div>
              ) : (
                <Chart
                  data={{ series: formattedData, current: parseFloat(price) }}
                  dimensions={{ width: 350, height: 250 }}
                  margins={{ top: 0, right: 20, bottom: 20, left: 20 }}
                  styles={{
                    brush: {
                      handle: {
                        west: saturate(0.1, tokenAColor) ?? theme.red1,
                        east: saturate(0.1, tokenBColor) ?? theme.blue1,
                      },
                    },
                  }}
                  interactive={interactive}
                  brushDomain={
                    leftPrice && rightPrice
                      ? [parseFloat(leftPrice?.toSignificant(5)), parseFloat(rightPrice?.toSignificant(5))]
                      : undefined
                  }
                  brushLabels={(x: number) =>
                    price ? `${((x / parseFloat(price) - 1) * 100).toFixed(2)}%` : undefined
                  }
                  onBrushDomainChange={onBrushDomainChangeEnded}
                />
              )}
            </>
          )}
        </Wrapper>
      </AutoColumn>
    </DarkBlueCard>
  )
}
