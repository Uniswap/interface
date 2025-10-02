import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExactOutputUnavailableWarningRowProps = {
  currencies: DerivedSwapInfo['currencies']
  outputTokenHasBuyTax: boolean
}

export function ExactOutputUnavailableWarningRow({
  currencies,
  outputTokenHasBuyTax,
}: ExactOutputUnavailableWarningRowProps): JSX.Element {
  const { t } = useTranslation()

  // Check if either currency is Solana
  const inputChainId = toSupportedChainId(currencies[CurrencyField.INPUT]?.currency.chainId)
  const outputChainId = toSupportedChainId(currencies[CurrencyField.OUTPUT]?.currency.chainId)
  const hasSolanaToken = (inputChainId && isSVMChain(inputChainId)) || (outputChainId && isSVMChain(outputChainId))

  // For Solana, show a different message
  if (hasSolanaToken) {
    return (
      <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
        <Text color="$statusCritical" textAlign="center" variant="body3">
          {t('swap.form.warning.output.solana')}
        </Text>
      </Flex>
    )
  }

  // For FOT tokens, show the existing message
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
