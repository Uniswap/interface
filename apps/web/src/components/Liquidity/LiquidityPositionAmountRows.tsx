import { getTokenDetailsURL } from 'appGraphql/data/util'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { getChainUrlParam } from 'utils/chainParams'

type AmountRow = {
  currencyInfo: CurrencyInfo
  fiatValue: Maybe<CurrencyAmount<Currency>>
  currencyAmount: CurrencyAmount<Currency>
}

type LiquidityPositionAmountRowsProps = {
  rows: AmountRow[]
}

export function LiquidityPositionAmountRows({ rows }: LiquidityPositionAmountRowsProps) {
  const navigate = useNavigate()
  const { formatCurrencyAmount } = useLocalizationContext()
  const chainUrlParam = getChainUrlParam(rows[0].currencyInfo.currency.chainId || UniverseChainId.Mainnet)

  const getLink = useCallback(
    (currencyInfo: CurrencyInfo) => {
      return getTokenDetailsURL({
        address: currencyInfo.currency.isToken ? currencyInfo.currency.address : undefined, // util handles native addresses
        chainUrlParam,
      })
    },
    [chainUrlParam],
  )

  return (
    <Flex gap="$gap16">
      {rows.map((row) => (
        <Flex row alignItems="center" justifyContent="space-between" key={row.currencyInfo.currencyId}>
          <TouchableArea onPress={() => navigate(getLink(row.currencyInfo))} {...ClickableTamaguiStyle}>
            <Flex row alignItems="center" gap="$gap12" maxWidth={160}>
              <CurrencyLogo currencyInfo={row.currencyInfo} size={24} />
              <Text variant="subheading1" color="neutral1" $lg={{ variant: 'subheading2' }}>
                {formatCurrencyAmount({ value: row.fiatValue, type: NumberType.FiatTokenPrice })}
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
