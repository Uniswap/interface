import { Flex, Text } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { InterfaceTrade } from '~/types/routing'
export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const inputCurrencyInfo = useCurrencyInfo(currencyId(trade.inputAmount.currency))
  const outputCurrencyInfo = useCurrencyInfo(currencyId(trade.outputAmount.currency))

  return (
    <Flex row centered gap="$gap8" width="100%">
      <CurrencyLogo currencyInfo={inputCurrencyInfo} size={16} />
      <Text variant="body3" color="$neutral1">
        {formatCurrencyAmount({
          value: trade.inputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.inputAmount.currency.symbol}
      </Text>
      <ArrowRight size="$icon.12" color="$neutral1" />
      <CurrencyLogo currencyInfo={outputCurrencyInfo} size={16} />
      <Text variant="body3" color="$neutral1">
        {formatCurrencyAmount({
          value: trade.outputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.outputAmount.currency.symbol}
      </Text>
    </Flex>
  )
}
