import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { Flex, Text, useExtractedTokenColor, useSporeColors } from '@universe/mycelium'
import { useMemo } from 'react'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getExactSharePercent } from 'uniswap/src/features/positions/utils'
import { NumberType } from 'utilities/src/format/types'

interface PositionTokenBreakdownProps {
  label: string
  formattedValue: string
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  /** Omit both amounts to collapse to the label + value header (e.g. closed positions show only "$0.00"). */
  amount0?: CurrencyAmount<Currency>
  amount1?: CurrencyAmount<Currency>
  /** token0 priced in token1, used to derive the value split locally (no USD oracle needed). */
  token0Price?: Price<Currency, Currency>
}

/**
 * Compute token0's share (0-100) of the combined value by converting amount0 into token1 terms
 * via the pool's current price. Returns undefined when the split can't be derived.
 */
function getToken0Percent({
  amount0,
  amount1,
  token0Price,
}: {
  amount0: CurrencyAmount<Currency>
  amount1: CurrencyAmount<Currency>
  token0Price?: Price<Currency, Currency>
}): number | undefined {
  if (!token0Price) {
    return undefined
  }
  try {
    const amount0InToken1 = token0Price.quote(amount0)
    // getExactSharePercent already returns undefined for a non-positive total.
    const percent = getExactSharePercent(amount0InToken1, amount0InToken1.add(amount1))
    return percent === undefined ? undefined : Number(percent.toFixed(4))
  } catch {
    return undefined
  }
}

export function PositionTokenBreakdown({
  label,
  formattedValue,
  currency0Info,
  currency1Info,
  amount0,
  amount1,
  token0Price,
}: PositionTokenBreakdownProps): JSX.Element {
  const colors = useSporeColors()
  const { formatPercent, formatCurrencyAmount } = useLocalizationContext()

  const { tokenColor: token0Color } = useExtractedTokenColor({
    imageUrl: currency0Info?.logoUrl,
    tokenName: currency0Info?.currency.name,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
    colorOverrides: currency0Info?.colorOverrides,
  })
  const { tokenColor: token1Color } = useExtractedTokenColor({
    imageUrl: currency1Info?.logoUrl,
    tokenName: currency1Info?.currency.name,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
    colorOverrides: currency1Info?.colorOverrides,
  })

  const percent0 = useMemo(
    () => (amount0 && amount1 ? getToken0Percent({ amount0, amount1, token0Price }) : undefined),
    [amount0, amount1, token0Price],
  )
  const percent1 = percent0 === undefined ? undefined : Math.max(0, 100 - percent0)

  const color0 = token0Color ?? colors.neutral3.val
  const color1 = token1Color ?? colors.neutral2.val

  return (
    <Flex gap="$spacing16" width="100%">
      <Flex gap="$spacing8">
        <Text color="$neutral2" variant="body3">
          {label}
        </Text>
        <Text color="$neutral1" variant="heading3">
          {formattedValue}
        </Text>
      </Flex>

      {amount0 && amount1 && (
        <Flex gap="$spacing8" width="100%">
          {percent0 !== undefined && percent1 !== undefined && (
            <>
              <Flex row alignItems="center" gap="$spacing8" width="100%">
                <CurrencyLogo hideNetworkLogo currencyInfo={currency0Info} size={iconSizes.icon20} />
                <Text flex={1} style={{ color: color0 }} variant="body2">
                  {formatPercent(percent0)}
                </Text>
                <Text style={{ color: color1 }} variant="body2">
                  {formatPercent(percent1)}
                </Text>
                <CurrencyLogo hideNetworkLogo currencyInfo={currency1Info} size={iconSizes.icon20} />
              </Flex>

              <Flex row borderRadius="$roundedFull" gap="$spacing2" height={8} overflow="hidden" width="100%">
                {amount0.greaterThan(0) && (
                  <Flex flex={percent0} height="100%" minWidth="$spacing4" style={{ backgroundColor: color0 }} />
                )}
                {amount1.greaterThan(0) && (
                  <Flex flex={percent1} height="100%" minWidth="$spacing4" style={{ backgroundColor: color1 }} />
                )}
              </Flex>
            </>
          )}

          <Flex row alignItems="center" justifyContent="space-between" width="100%">
            <Text color="$neutral2" variant="body2">
              {`${formatCurrencyAmount({ value: amount0, type: NumberType.TokenNonTx })} ${amount0.currency.symbol}`}
            </Text>
            <Text color="$neutral2" variant="body2">
              {`${formatCurrencyAmount({ value: amount1, type: NumberType.TokenNonTx })} ${amount1.currency.symbol}`}
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}
