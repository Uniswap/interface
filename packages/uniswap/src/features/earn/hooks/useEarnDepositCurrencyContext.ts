import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnDepositSourceOption, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

type UseEarnDepositCurrencyContextParams = {
  vault: EarnVaultInfo
  position?: EarnPositionInfo
  isWithdrawing: boolean
  selectedDepositSource: EarnDepositSourceOption | undefined
  chainId: UniverseChainId
}

type UseEarnDepositCurrencyContextResult = {
  currencyInfo: CurrencyInfo | undefined
  symbol: string
  walletBalance: number
  positionBalanceUsd: number
  availableBalance: number
  destinationCurrencyId: string
}

export function useEarnDepositCurrencyContext({
  vault,
  position,
  isWithdrawing,
  selectedDepositSource,
  chainId,
}: UseEarnDepositCurrencyContextParams): UseEarnDepositCurrencyContextResult {
  const { convertFiatAmount } = useLocalizationContext()
  const destinationCurrencyId = getEarnVaultWithdrawDestinationCurrencyId({
    vault,
    destinationChainId: chainId,
  })
  const withdrawCurrencyInfo = useCurrencyInfo(destinationCurrencyId)
  const fallbackDepositCurrencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const currencyInfo = selectCurrencyInfo({
    isWithdrawing,
    withdrawCurrencyInfo,
    sourceCurrencyInfo: selectedDepositSource?.currencyInfo,
    fallbackDepositCurrencyInfo,
  })
  const symbol = currencyInfo?.currency.symbol ?? ''
  const walletBalance = selectedDepositSource?.balanceQuantity ?? 0
  const positionBalanceUsd = position?.depositedUsd ?? 0
  const availableBalance = isWithdrawing ? convertFiatAmount(positionBalanceUsd).amount : walletBalance

  return {
    currencyInfo,
    symbol,
    walletBalance,
    positionBalanceUsd,
    availableBalance,
    destinationCurrencyId,
  }
}

function selectCurrencyInfo({
  isWithdrawing,
  withdrawCurrencyInfo,
  sourceCurrencyInfo,
  fallbackDepositCurrencyInfo,
}: {
  isWithdrawing: boolean
  withdrawCurrencyInfo: Maybe<CurrencyInfo>
  sourceCurrencyInfo: CurrencyInfo | undefined
  fallbackDepositCurrencyInfo: Maybe<CurrencyInfo>
}): CurrencyInfo | undefined {
  if (isWithdrawing) {
    return withdrawCurrencyInfo ?? undefined
  }
  return sourceCurrencyInfo ?? fallbackDepositCurrencyInfo ?? undefined
}
