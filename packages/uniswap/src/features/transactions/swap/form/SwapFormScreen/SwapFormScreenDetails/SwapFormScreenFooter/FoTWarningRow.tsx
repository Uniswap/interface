import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

type FoTWarningRowProps = {
  currencies: DerivedSwapInfo['currencies']
  outputTokenHasBuyTax: boolean
}

export function FoTWarningRow({ currencies, outputTokenHasBuyTax }: FoTWarningRowProps): JSX.Element {
  const { t } = useTranslation()
  const fotCurrencySymbol = outputTokenHasBuyTax
    ? currencies[CurrencyField.OUTPUT]?.currency.symbol
    : currencies[CurrencyField.INPUT]?.currency.symbol

  return (
    <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
      <Text color="$statusCritical" textAlign="center" variant="body3">
        {fotCurrencySymbol
          ? t('swap.form.warning.output.fotFees', {
              fotCurrencySymbol,
            })
          : t('swap.form.warning.output.fotFees.fallback')}
      </Text>
    </Flex>
  )
}
