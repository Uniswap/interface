import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExactOutputUnavailableWarningRowProps = {
  currencies: DerivedSwapInfo['currencies']
  outputTokenHasBuyTax: boolean
  isCrossChain: boolean
}

export function ExactOutputUnavailableWarningRow({
  currencies,
  outputTokenHasBuyTax,
  isCrossChain,
}: ExactOutputUnavailableWarningRowProps): JSX.Element {
  const { t } = useTranslation()

  const warningMessage = getWarningMessage({ currencies, outputTokenHasBuyTax, isCrossChain, t })

  return (
    <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
      <Text color="$statusCritical" textAlign="center" variant="body3">
        {warningMessage}
      </Text>
    </Flex>
  )
}

function getWarningMessage({
  currencies,
  outputTokenHasBuyTax,
  isCrossChain,
  t,
}: ExactOutputUnavailableWarningRowProps & { t: ReturnType<typeof useTranslation>['t'] }): string {
  if (isCrossChain) {
    return t('swap.form.warning.output.crossChain')
  }

  const inputChainId = toSupportedChainId(currencies[CurrencyField.INPUT]?.currency.chainId)
  const outputChainId = toSupportedChainId(currencies[CurrencyField.OUTPUT]?.currency.chainId)
  const hasSolanaToken = (inputChainId && isSVMChain(inputChainId)) || (outputChainId && isSVMChain(outputChainId))

  if (hasSolanaToken) {
    return t('swap.form.warning.output.solana')
  }

  const fotCurrencySymbol = outputTokenHasBuyTax
    ? currencies[CurrencyField.OUTPUT]?.currency.symbol
    : currencies[CurrencyField.INPUT]?.currency.symbol

  return fotCurrencySymbol
    ? t('swap.form.warning.output.fotFees', { fotCurrencySymbol })
    : t('swap.form.warning.output.fotFees.fallback')
}
