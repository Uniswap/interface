import { CurrencyAmount, Percent } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import useTheme from '../../hooks/useTheme'
import { TYPE } from '../../theme'
import { warningSeverity } from '../../utils/prices'

export function FiatValue({
  fiatValue,
  priceImpact,
}: {
  fiatValue: CurrencyAmount | null | undefined
  priceImpact?: Percent
}) {
  const theme = useTheme()
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return theme.green1
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return theme.text4
    if (severity < 3) return theme.yellow1
    return theme.red1
  }, [priceImpact, theme.green1, theme.red1, theme.text4, theme.yellow1])

  return (
    <TYPE.body fontSize={14} color={fiatValue ? theme.text2 : theme.text4}>
      {fiatValue ? '~' : ''}${fiatValue ? Number(fiatValue?.toSignificant(6)).toLocaleString('en') : '-'}
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}> ({priceImpact.multiply(-100).toSignificant(3)}%)</span>
      ) : null}
    </TYPE.body>
  )
}
