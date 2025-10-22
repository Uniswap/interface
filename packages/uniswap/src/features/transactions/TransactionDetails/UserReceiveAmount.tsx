import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'

export function UserReceiveAmount({
  amountUserWillReceive,
  outputCurrency,
}: {
  amountUserWillReceive: CurrencyAmount<Currency>
  outputCurrency?: Currency
}): JSX.Element {
  const { t } = useTranslation()
  const receivedAmountPostFees = formatCurrencyAmount({
    amount: amountUserWillReceive,
    locale: 'en-US',
    type: NumberType.TokenTx,
    placeholder: '',
  })

  const formattedPostFeesAmount = outputCurrency ? `${receivedAmountPostFees} ${outputCurrency.symbol}` : '-'

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Text color="$neutral2" variant="body3">
        {t('common.youReceive')}
      </Text>
      <Text variant="body3">{formattedPostFeesAmount}</Text>
    </Flex>
  )
}
