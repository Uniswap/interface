import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { clickableStyle, Flex, Text, TouchableArea } from '@universe/mycelium'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { getTokenDetailsURL } from '~/data/util'

type AmountRow = {
  currencyInfo: CurrencyInfo
  currencyAmount: CurrencyAmount<Currency>
  /**
   * What the amount is worth, in USD. Some rows are valued by a client-side quote and others by the
   * backend, so callers reduce whichever they have to a plain figure; unset renders the placeholder.
   */
  usdValue?: number
}

type LiquidityPositionAmountRowsProps = {
  rows: AmountRow[]
}

export function LiquidityPositionAmountRows({ rows }: LiquidityPositionAmountRowsProps) {
  const navigate = useNavigate()
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()

  const getLink = useCallback((currencyInfo: CurrencyInfo) => {
    return getTokenDetailsURL({
      address: currencyInfo.currency.isToken ? currencyInfo.currency.address : undefined, // util handles native addresses
      // Derived per row rather than from the first one: reward rows can be denominated in a token
      // from a different chain than the row above them.
      chainId: currencyInfo.currency.chainId,
    })
  }, [])

  return (
    <Flex gap="$gap16">
      {rows.map((row) => (
        <Flex row alignItems="center" justifyContent="space-between" key={row.currencyInfo.currencyId}>
          <TouchableArea
            onPress={() => navigate(getLink(row.currencyInfo))}
            {...clickableStyle}
            pressStyle={{ scale: 1 }}
          >
            <Flex row alignItems="center" gap="$gap12" maxWidth={160}>
              <CurrencyLogo currencyInfo={row.currencyInfo} size={24} />
              <Text variant="subheading1" color="$neutral1" $lg={{ variant: 'subheading2' }}>
                {convertFiatAmountFormatted(row.usdValue, NumberType.FiatTokenPrice)}
              </Text>
            </Flex>
          </TouchableArea>
          <Flex alignItems="flex-end" gap="$gap4">
            <Flex row alignItems="center" justifyContent="flex-end" gap="$gap4">
              <Text variant="body2" color="$neutral2">
                {formatCurrencyAmount({ value: row.currencyAmount, type: NumberType.TokenNonTx })}{' '}
                {row.currencyAmount.currency.symbol}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}
