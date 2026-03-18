import { Percent } from '@uniswap/sdk-core'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'

export type FoTFeeType = 'buy' | 'sell'

export type FeeOnTransferFeeGroupProps = {
  inputTokenInfo: TokenFeeInfo
  outputTokenInfo: TokenFeeInfo
}

export type TokenFeeInfo = {
  currencyInfo: Maybe<CurrencyInfo>
  tokenSymbol: string
  fee: Percent
  formattedUsdAmount: string
  formattedAmount: string
}

export type TokenWarningProps = {
  currencyInfo: Maybe<CurrencyInfo>
  tokenProtectionWarning: TokenProtectionWarning
  severity: WarningSeverity
}
