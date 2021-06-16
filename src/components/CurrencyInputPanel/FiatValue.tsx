import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import useTheme from '../../hooks/useTheme'
import { TYPE } from '../../theme'
import { warningSeverity } from '../../utils/prices'
import HoverInlineText from 'components/HoverInlineText'
import { Trans } from '@lingui/macro'

export function FiatValue({
  fiatValue,
  priceImpact,
}: {
  fiatValue: CurrencyAmount<Currency> | null | undefined
  priceImpact?: Percent
}) {
  const theme = useTheme()
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return theme.green1
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return theme.text3
    if (severity < 3) return theme.yellow1
    return theme.red1
  }, [priceImpact, theme.green1, theme.red1, theme.text3, theme.yellow1])

  return (
    <TYPE.body fontSize={14} color={fiatValue ? theme.text2 : theme.text4}>
      {fiatValue ? (
        <Trans>
          ~$ <HoverInlineText text={fiatValue?.toSignificant(6, { groupSeparator: ',' })} />
        </Trans>
      ) : (
        ''
      )}
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}>
          {' '}
          (<Trans>{priceImpact.multiply(-1).toSignificant(3)}%</Trans>)
        </span>
      ) : null}
    </TYPE.body>
  )
}
