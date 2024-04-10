import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'

export type SlippageSettingsRowProps = {
  derivedSwapInfo: DerivedSwapInfo
  onSlippageChange: (slippage: number | undefined) => void
  onPress: () => void
}
