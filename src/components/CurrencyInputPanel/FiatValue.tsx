import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'

import HoverInlineText from 'components/HoverInlineText'
import { TYPE } from '../../theme'
import { Trans } from '@lingui/macro'
import { useIsDarkMode } from 'state/user/hooks'
import { useMemo } from 'react'
import useTheme from '../../hooks/useTheme'
import { warningSeverity } from '../../utils/prices'

export function FiatValue({
  fiatValue,
  priceImpact,
  isMobile = false,
  style = {}
  
}: {
  fiatValue: CurrencyAmount<Currency> | null | undefined
  priceImpact?: Percent,
  isMobile?:boolean,
  style?: any
}) {
  const theme = useTheme()
  const darkMode = useIsDarkMode()
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return theme.green1
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return darkMode ? theme.white : theme.secondary3
    if (severity < 3) return theme.yellow1
    return theme.red1
  }, [priceImpact,darkMode, theme.green1, theme.red1, theme.text3, theme.yellow1])

  return (
    <TYPE.body style={{...style}} fontSize={isMobile ? 11.5 : 14} color={fiatValue ? theme.text2 : theme.text4}>
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
          (<Trans >{priceImpact.multiply(-1).toSignificant(3)}%</Trans>)
        </span>
      ) : null}
    </TYPE.body>
  )
}
