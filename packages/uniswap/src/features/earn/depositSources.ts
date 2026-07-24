import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { getEarnDepositSourceSupportedChainIds } from 'uniswap/src/features/earn/constants'
import type {
  EarnDepositSourceOption,
  EarnDepositSourceOptionsBySupport,
  EarnVaultInfo,
} from 'uniswap/src/features/earn/types'
import { addCurrencyId, isWrappedNativeCurrencyId, isWrappedNativeEarnVault } from 'uniswap/src/features/earn/utils'
import { areCurrencyIdsEqual, buildNativeCurrencyId, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export function getEarnVaultDepositSourceCurrencyIds({
  tokenProjectCurrencyIds,
  vault,
}: {
  tokenProjectCurrencyIds: readonly string[] | undefined
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>
}): string[] {
  const currencyIds: string[] = []
  const shouldAddNativeSources = isWrappedNativeEarnVault(vault)
  const candidateCurrencyIds = [vault.currencyId, ...(tokenProjectCurrencyIds ?? [])]

  candidateCurrencyIds.forEach((currencyId) => {
    addCurrencyId(currencyIds, currencyId)

    if (!shouldAddNativeSources || !isWrappedNativeCurrencyId(currencyId)) {
      return
    }

    const chainId = currencyIdToChain(currencyId)
    if (chainId) {
      addCurrencyId(currencyIds, buildNativeCurrencyId(chainId))
    }
  })

  addCurrencyId(currencyIds, vault.displayCurrencyId)
  return currencyIds
}

export function getEarnDepositSourceOptions({
  portfolioBalances,
  tokenProjectCurrencyIds,
  vault,
}: {
  portfolioBalances: Record<string, PortfolioBalance> | undefined
  tokenProjectCurrencyIds: readonly string[] | undefined
  vault: Pick<EarnVaultInfo, 'currencyId' | 'displayCurrencyId'>
}): EarnDepositSourceOption[] {
  if (!portfolioBalances) {
    return []
  }

  const sourceCurrencyIds = getEarnVaultDepositSourceCurrencyIds({
    tokenProjectCurrencyIds,
    vault,
  })
  const options: EarnDepositSourceOption[] = []

  Object.values(portfolioBalances).forEach((balance) => {
    const isDepositSource = sourceCurrencyIds.some((currencyId) =>
      areCurrencyIdsEqual(currencyId, balance.currencyInfo.currencyId),
    )
    if (!isDepositSource || balance.quantity <= 0) {
      return
    }

    options.push({
      id: balance.currencyInfo.currencyId,
      chainId: balance.currencyInfo.currency.chainId,
      currencyInfo: balance.currencyInfo,
      balanceQuantity: balance.quantity,
      balanceRaw: balance.quantityRaw,
      balanceUsd: balance.balanceUSD ?? undefined,
    })
  })

  return options.sort(compareEarnDepositSourceBalanceDesc)
}

export function getEarnDepositSourceOptionsBySupport({
  depositSourceOptions,
}: {
  depositSourceOptions: readonly EarnDepositSourceOption[]
}): EarnDepositSourceOptionsBySupport {
  const supportedDepositSourceOptions: EarnDepositSourceOption[] = []
  const unsupportedDepositSourceOptions: EarnDepositSourceOption[] = []
  const supportedChainIds = getEarnDepositSourceSupportedChainIds()

  depositSourceOptions.forEach((option) => {
    const destination = supportedChainIds.includes(option.chainId)
      ? supportedDepositSourceOptions
      : unsupportedDepositSourceOptions

    destination.push(option)
  })

  return {
    supportedDepositSourceOptions,
    unsupportedDepositSourceOptions,
  }
}

function compareEarnDepositSourceBalanceDesc(
  optionA: EarnDepositSourceOption,
  optionB: EarnDepositSourceOption,
): number {
  // Priced rows (balanceUsd > 0) always rank above unpriced rows so that a small priced balance
  // doesn't fall below a large unpriced one — USD and token-quantity units aren't comparable.
  const aIsPriced = isPricedDepositSource(optionA)
  const bIsPriced = isPricedDepositSource(optionB)
  if (aIsPriced !== bIsPriced) {
    return aIsPriced ? -1 : 1
  }

  const balanceDiff = aIsPriced
    ? (optionB.balanceUsd ?? 0) - (optionA.balanceUsd ?? 0)
    : optionB.balanceQuantity - optionA.balanceQuantity
  if (balanceDiff !== 0) {
    return balanceDiff
  }

  if (optionA.currencyInfo.currency.isNative !== optionB.currencyInfo.currency.isNative) {
    return optionA.currencyInfo.currency.isNative ? -1 : 1
  }

  if (optionA.chainId !== optionB.chainId) {
    return optionA.chainId - optionB.chainId
  }

  // Unreachable in practice: ids are `${chainId}-${address}`, so equal chainIds + same nativeness + same balance
  // means the same currency. Kept for sort stability and to satisfy the comparator contract.
  return optionA.id.localeCompare(optionB.id)
}

function isPricedDepositSource(option: EarnDepositSourceOption): boolean {
  return option.balanceUsd !== undefined && option.balanceUsd > 0
}
