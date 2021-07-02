import React, { ReactNode, useCallback } from 'react'
import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { DarkBlueCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import Loader from 'components/Loader'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { saturate } from 'polished'
import { Inbox, XCircle } from 'react-feather'
import { batch } from 'react-redux'
import { Box } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../theme'
import { Chart } from './Chart'
import { useDensityChartData } from './hooks'
import Row, { RowBetween } from 'components/Row'
import { format } from 'd3'

const Wrapper = styled(Box)`
  min-height: 200px;
`

const ChartWrapper = styled(Box)`
  position: relative;

  display: grid;
  justify-content: center;
  align-content: center;
`

function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <ColumnCenter style={{ height: '100%', justifyContent: 'center' }}>
      {icon}
      {message && (
        <TYPE.mediumHeader padding={10} marginTop="20px">
          {message}
        </TYPE.mediumHeader>
      )}
    </ColumnCenter>
  )
}

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  price,
  priceLabel,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: number
  price: number | undefined
  priceLabel: ReactNode | undefined
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()

  const tokenAColor = useColor(currencyA?.wrapped)
  const tokenBColor = useColor(currencyB?.wrapped)

  const { isLoading, isUninitialized, isError, formattedData } = useDensityChartData({
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

  interactive = interactive && Boolean(formattedData?.length)

  return (
    <DarkBlueCard>
      <AutoColumn gap="md">
        <RowBetween>
          <TYPE.label>
            <Trans>Liquidity Distribution</Trans>
          </TYPE.label>
        </RowBetween>

        <Wrapper>
          {isUninitialized ? (
            <InfoBox
              message={<Trans>Your position will appear here.</Trans>}
              icon={<Inbox size={56} stroke={theme.text1} />}
            />
          ) : isLoading || !price ? (
            <InfoBox icon={<Loader size="30px" stroke={theme.text4} />} />
          ) : isError ? (
            <InfoBox
              message={<Trans>Something went wrong...</Trans>}
              icon={<XCircle size={56} stroke={theme.text4} />}
            />
          ) : (
            <>
              <Row justifyItems="center">{priceLabel}</Row>

              <ChartWrapper>
                {!formattedData || formattedData === [] ? (
                  <InfoBox message={<Trans>Nothing to show</Trans>} icon={<XCircle size={56} stroke={theme.text4} />} />
                ) : (
                  <Chart
                    data={{ series: formattedData, current: price }}
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
                    brushLabels={(x: number) => (price ? format('.0f%')(((x - price) / price) * 100) : undefined)}
                    onBrushDomainChange={onBrushDomainChangeEnded}
                  />
                )}
              </ChartWrapper>
            </>
          )}
        </Wrapper>
      </AutoColumn>
    </DarkBlueCard>
  )
}
