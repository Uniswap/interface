import {
  TransactionSettingKey,
  TransactionSettingsState,
} from 'uniswap/src/features/transactions/components/settings/slice'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export function selectTransactionSettings(
  key: TransactionSettingKey,
): (state: UniswapState) => TransactionSettingsState {
  return (state) => state.transactionSettings[key]
}
