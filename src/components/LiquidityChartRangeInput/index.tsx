import { Trans } from '@lingui/macro'
import { Currency, Price, Token } from '@pollum-io/sdk-core'
import { FeeAmount } from '@pollum-io/v2-sdk'
import LoadingGifLight from 'assets/images/lightLoading.gif'
import LoadingGif from 'assets/images/loading.gif'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { LoaderGif } from 'components/Icons/LoadingSpinner'
import { format } from 'd3'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { BarChart2, CloudOff, Inbox } from 'react-feather'
import { batch } from 'react-redux'
import { Bound } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { ThemedText } from '../../theme'
import { Chart } from './Chart'
import { useDensityChartData } from './hooks'
import { ZoomLevels } from './types'

const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.LOW]: {
    initialMin: 0.999,
    initialMax: 1.001,
    min: 0.00001,
    max: 1.5,
  },
  [FeeAmount.MEDIUM]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
  [FeeAmount.HIGH]: {
    initialMin: 0.5,
    initialMax: 2,
    min: 0.00001,
    max: 20,
  },
}

const ChartWrapper = styled.div`
  position: relative;

  justify-content: center;
  align-content: center;
`

function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <ColumnCenter style={{ height: '100%', justifyContent: 'center' }}>
      {icon}
      {message && (
        <ThemedText.DeprecatedMediumHeader padding={10} marginTop="20px" textAlign="center">
          {message}
        </ThemedText.DeprecatedMediumHeader>
      )}
    </ColumnCenter>
  )
}

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount?: FeeAmount
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  price: number | undefined
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
  })

  const onBrushDomainChangeEnded = useCallback(
    (domain: [number, number], mode: string | undefined) => {
      let leftRangeValue = Number(domain[0])
      const rightRangeValue = Number(domain[1])

      if (leftRangeValue <= 0) {
        leftRangeValue = 1 / 10 ** 6
      }

      batch(() => {
        // simulate user input for auto-formatting and other validations
        if (
          (!ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] || mode === 'handle' || mode === 'reset') &&
          leftRangeValue > 0
        ) {
          onLeftRangeInput(leftRangeValue.toFixed(6))
        }

        if ((!ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] || mode === 'reset') && rightRangeValue > 0) {
          // todo: remove this check. Upper bound for large numbers
          // sometimes fails to parse to tick.
          if (rightRangeValue < 1e35) {
            onRightRangeInput(rightRangeValue.toFixed(6))
          }
        }
      })
    },
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit]
  )

  interactive = interactive && Boolean(formattedData?.length)

  const brushDomain: [number, number] | undefined = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const brushLabelValue = useCallback(
    (d: 'w' | 'e', x: number) => {
      if (!price) return ''

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) return '0'
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) return '∞'

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${format(Math.abs(percent) > 1 ? '.2~s' : '.2~f')(percent)}%` : ''
    },
    [isSorted, price, ticksAtLimit]
  )

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading)

  return (
    <AutoColumn gap="md" style={{ minHeight: '200px' }}>
      {isUninitialized ? (
        <InfoBox
          message={<Trans>Your position will appear here.</Trans>}
          icon={<Inbox size={56} stroke={theme.textPrimary} />}
        />
      ) : isLoading ? (
        <InfoBox icon={<LoaderGif size="40px" gif={isDarkMode ? LoadingGif : LoadingGifLight} />} />
      ) : error ? (
        <InfoBox
          message={<Trans>Liquidity data not available.</Trans>}
          icon={<CloudOff size={56} stroke={theme.deprecated_text4} />}
        />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox
          message={<Trans>There is no liquidity data.</Trans>}
          icon={<BarChart2 size={56} stroke={theme.deprecated_text4} />}
        />
      ) : (
        <ChartWrapper>
          <Chart
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: theme.accentAction,
              },
              brush: {
                handle: {
                  west: '#19EBCE',
                  east: '#8A15E6',
                },
              },
            }}
            interactive={interactive}
            brushLabels={brushLabelValue}
            brushDomain={brushDomain}
            onBrushDomainChange={onBrushDomainChangeEnded}
            zoomLevels={ZOOM_LEVELS[feeAmount ?? FeeAmount.MEDIUM]}
            ticksAtLimit={ticksAtLimit}
          />
        </ChartWrapper>
      )}
    </AutoColumn>
  )
}
