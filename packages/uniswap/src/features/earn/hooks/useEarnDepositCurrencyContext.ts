import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getEarnWithdrawableAmount } from 'uniswap/src/features/earn/amount'
import type { EarnDepositSourceOption, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/withdrawDestination'
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
  withdrawableBalanceUsd: number
  availableBalance: number
  isWithdrawLiquidityLimited: boolean
  destinationCurrencyId: string | undefined
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
  const withdrawableAmount = position
    ? getEarnWithdrawableAmount({ position, vault })
    : { availableUsd: 0, isLiquidityLimited: false }
  const withdrawableBalanceUsd = withdrawableAmount.availableUsd
  const availableBalance = isWithdrawing ? convertFiatAmount(withdrawableBalanceUsd).amount : walletBalance

  return {
    currencyInfo,
    symbol,
    walletBalance,
    withdrawableBalanceUsd,
    availableBalance,
    isWithdrawLiquidityLimited: withdrawableAmount.isLiquidityLimited,
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
