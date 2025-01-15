// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { Chart } from 'components/LiquidityChartRangeInput/Chart'
import { useDensityChartData } from 'components/LiquidityChartRangeInput/hooks'
import { ZoomLevels } from 'components/LiquidityChartRangeInput/types'
import { AutoColumn, ColumnCenter } from 'components/deprecated/Column'
import { useColor } from 'hooks/useColor'
import styled, { useTheme } from 'lib/styled-components'
import { saturate } from 'polished'
import { ReactNode, useCallback, useMemo } from 'react'
import { BarChart2, CloudOff, Inbox } from 'react-feather'
import { Trans } from 'react-i18next'
import { batch } from 'react-redux'
import { Bound } from 'state/mint/v3/actions'
import { ThemedText } from 'theme/components'
import { Flex, Shine } from 'ui/src'
import { useFormatter } from 'utils/formatNumbers'

const LOW_ZOOM_LEVEL = {
  initialMin: 0.999,
  initialMax: 1.001,
  min: 0.00001,
  max: 1.5,
}
const ZOOM_LEVELS: Record<FeeAmount, ZoomLevels> = {
  [FeeAmount.LOWEST]: LOW_ZOOM_LEVEL,
  [FeeAmount.LOW_200]: LOW_ZOOM_LEVEL,
  [FeeAmount.LOW_300]: LOW_ZOOM_LEVEL,
  [FeeAmount.LOW_400]: LOW_ZOOM_LEVEL,
  [FeeAmount.LOW]: LOW_ZOOM_LEVEL,
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
  width: 100%;
  max-height: 200px;
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

function LoadingBar({ height }: { height: string }) {
  return <Flex height={height} width="10%" backgroundColor="$neutral2" />
}

function LoadingBars() {
  return (
    <Shine>
      <Flex row centered height="100%" width="100%" gap="$gap8" alignItems="flex-end">
        {[10, 20, 45, 70, 80, 55, 30, 15].map((h) => (
          <LoadingBar key={h} height={`${h}%`} />
        ))}
      </Flex>
    </Shine>
  )
}

export default function LiquidityChartRangeInput({
  currencyA,
  currencyB,
  feeAmount,
  tickSpacing,
  poolId,
  protocolVersion,
  ticksAtLimit,
  price,
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  interactive,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
  tickSpacing?: number
  poolId?: string
  protocolVersion: ProtocolVersion
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
  price?: number
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  interactive: boolean
}) {
  const theme = useTheme()

  const tokenAColor = useColor(currencyA)
  const tokenBColor = useColor(currencyB)

  const isSorted = currencyA && currencyB && currencyA?.wrapped.sortsBefore(currencyB?.wrapped)

  const { isLoading, error, formattedData } = useDensityChartData({
    currencyA,
    currencyB,
    feeAmount,
    version: protocolVersion,
    poolId,
    tickSpacing,
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
    [isSorted, onLeftRangeInput, onRightRangeInput, ticksAtLimit],
  )

  interactive = interactive && Boolean(formattedData?.length)

  const brushDomain: [number, number] | undefined = useMemo(() => {
    const leftPrice = isSorted ? priceLower : priceUpper?.invert()
    const rightPrice = isSorted ? priceUpper : priceLower?.invert()

    return leftPrice && rightPrice
      ? [parseFloat(leftPrice?.toSignificant(6)), parseFloat(rightPrice?.toSignificant(6))]
      : undefined
  }, [isSorted, priceLower, priceUpper])

  const { formatDelta } = useFormatter()
  const brushLabelValue = useCallback(
    (d: 'w' | 'e', x: number) => {
      if (!price) {
        return ''
      }

      if (d === 'w' && ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]) {
        return '0'
      }
      if (d === 'e' && ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]) {
        return '∞'
      }

      const percent = (x < price ? -1 : 1) * ((Math.max(x, price) - Math.min(x, price)) / price) * 100

      return price ? `${(Math.sign(percent) < 0 ? '-' : '') + formatDelta(percent)}` : ''
    },
    [formatDelta, isSorted, price, ticksAtLimit],
  )

  const isUninitialized = !currencyA || !currencyB || (formattedData === undefined && !isLoading && !error)

  return (
    <AutoColumn gap="md" style={{ minHeight: '200px' }}>
      {isUninitialized ? (
        <InfoBox message={<Trans i18nKey="position.appearHere" />} icon={<Inbox size={56} stroke={theme.neutral1} />} />
      ) : isLoading ? (
        <LoadingBars />
      ) : error ? (
        <InfoBox
          message={<Trans i18nKey="position.noLiquidity" />}
          icon={<CloudOff size={56} stroke={theme.neutral2} />}
        />
      ) : !formattedData || formattedData.length === 0 || !price ? (
        <InfoBox
          message={<Trans i18nKey="position.noLiquidityData" />}
          icon={<BarChart2 size={56} stroke={theme.neutral2} />}
        />
      ) : (
        <ChartWrapper>
          <Chart
            data={{ series: formattedData, current: price }}
            dimensions={{ width: 560, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: theme.accent1,
              },
              brush: {
                handle: {
                  west: saturate(0.1, tokenAColor) ?? theme.critical,
                  east: saturate(0.1, tokenBColor) ?? theme.accent1,
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
