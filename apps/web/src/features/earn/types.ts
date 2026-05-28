import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnVaultFlow, EarnVaultTab } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import type { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

export type EarnVaultModalVaultData = {
  availableBalance: number
  balanceLookupSettled: boolean
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  hasPosition: boolean
  isConnected: boolean
  position: EarnPositionInfo | undefined
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
  onReviewDeposit: (submittedAmount: string) => void
  onSwapForToken: () => void
  onWithdraw: () => void
  onReviewWithdraw: (params: { amount: string; chainId: UniverseChainId }) => void
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
