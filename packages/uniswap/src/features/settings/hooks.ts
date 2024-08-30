import { useSelector } from 'react-redux'
import {
  selectWalletHideSmallBalancesSetting,
  selectWalletHideSpamTokensSetting,
} from 'uniswap/src/features/settings/selectors'

export function useHideSmallBalancesSetting(): boolean {
  return useSelector(selectWalletHideSmallBalancesSetting)
}

export function useHideSpamTokensSetting(): boolean {
  return useSelector(selectWalletHideSpamTokensSetting)
}
