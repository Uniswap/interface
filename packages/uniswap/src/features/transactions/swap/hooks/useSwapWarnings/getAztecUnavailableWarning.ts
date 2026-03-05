import { TFunction } from 'i18next'
import { GeneratedIcon } from 'ui/src'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { shouldShowAztecWarning } from 'uniswap/src/hooks/useShouldShowAztecWarning'
import { CurrencyField } from 'uniswap/src/types/currency'

export const AZTEC_ADDRESS = '0xA27EC0006e59f245217Ff08CD52A7E8b169E62D2'.toLowerCase()
export const AZTEC_URL = 'https://sale.aztec.network/auction'

export function getAztecUnavailableWarning({
  t,
  currencies,
  isAztecDisabled,
}: {
  t: TFunction
  currencies: DerivedSwapInfo['currencies']
  isAztecDisabled: boolean
}): Warning | undefined {
  if (!isAztecDisabled) {
    return undefined
  }
  const inputCurrency = currencies[CurrencyField.INPUT]?.currency
  const outputCurrency = currencies[CurrencyField.OUTPUT]?.currency

  const inputTokenAddress = inputCurrency?.isToken ? inputCurrency.address : ''
  const outputTokenAddress = outputCurrency?.isToken ? outputCurrency.address : ''

  const isAztecSelected =
    shouldShowAztecWarning({ address: inputTokenAddress, isAztecDisabled }) ||
    shouldShowAztecWarning({ address: outputTokenAddress, isAztecDisabled })

  if (!isAztecSelected) {
    return undefined
  }

  return {
    type: WarningLabel.AztecUnavailable,
    severity: WarningSeverity.Blocked,
    action: WarningAction.DisableReview,
    icon: WarningIcon as GeneratedIcon,
    title: t('swap.warning.aztecUnavailable.title'),
    message: t('swap.warning.aztecUnavailable.message'),
    link: AZTEC_URL,
  }
}
