import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { EarnVaultFlow, EarnVaultTab } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnDepositSourceOption, EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'

export type EarnVaultModalVaultData = {
  balanceLookupSettled: boolean
  /** User-facing token info for this vault. Wrapped-native vaults use native currency here. */
  currencyInfo: Maybe<CurrencyInfo>
  depositSourceOptions: EarnDepositSourceOption[]
  hasPosition: boolean
  isConnected: boolean
  position: EarnPositionInfo | undefined
  selectedDepositSource: EarnDepositSourceOption | undefined
  setSelectedDepositSourceCurrencyId: (currencyId: string) => void
  symbol: string
  vault: EarnVaultInfo | null
}

export type EarnVaultModalFlowHandlers = {
  onBackToDepositAmount: () => void
  onBackToVault: () => void
  onBackToWithdrawAmount: () => void
  onBuyWithCash: () => void
  onClose: () => void
  onDeposit: () => void
  onReviewDeposit: (params: { amount: string; sourceChainId: UniverseChainId; sourceCurrencyId: string }) => void
  onSwapForToken: () => void
  onWithdraw: () => void
  onReviewWithdraw: (params: { amount: string; chainId: UniverseChainId; destinationCurrencyId: string }) => void
}

export type EarnVaultModalTabState = {
  selectedTab: EarnVaultTab
  setSelectedTab: (tab: EarnVaultTab) => void
}

export type EarnVaultModalContentProps = {
  onConnectWallet: () => void
  flow: EarnVaultFlow
  flowHandlers: EarnVaultModalFlowHandlers
  tabState: EarnVaultModalTabState
  vaultData: EarnVaultModalVaultData
}
