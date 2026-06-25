import { type TransactionRequest } from '@ethersproject/providers'
import type { GasFeeResult, TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { DappNetworkCostRow } from 'wallet/src/components/dappRequests/DappNetworkCostRow'
import { DappWalletLineItem } from 'wallet/src/components/dappRequests/DappWalletLineItem'
import { TransactionWarningBanner } from 'wallet/src/components/dappRequests/TransactionWarningBanner'
import type { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import {
  isGasBearingMethod,
  NetworkFeeFooter,
} from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

interface DappRequestFooterProps {
  chainId: UniverseChainId
  account: string
  riskLevel: TransactionRiskLevel
  confirmedRisk?: boolean
  onConfirmRisk?: (confirmed: boolean) => void
  gasFee?: GasFeeResult
  requestMethod?: string
  showSmartWalletActivation?: boolean
  /**
   * The validated transaction request for the dapp tx — supplied when the
   * request is gas-bearing (eth_sendTransaction / wallet_sendCalls). Used by
   * the gas-overrides Network cost row to fetch recommended values for
   * validation. Undefined for signature-only methods.
   */
  tx?: TransactionRequest
  /** Controlled per-request gas overrides — only meaningful when the
   *  GasFeeOverrides flag is on. Undefined => no overrides applied. */
  gasOverrides?: GasFeeOverrides
  onChangeGasOverrides?: (overrides: GasFeeOverrides | undefined) => void
  sponsorMetadata?: TradingApi.SponsorMetadata
}

/**
 * Shared footer component for dapp request screens
 * Displays network fee, wallet selection, and risk warning banner
 */
export function DappRequestFooter({
  chainId,
  account,
  riskLevel,
  confirmedRisk,
  onConfirmRisk,
  gasFee,
  requestMethod,
  showSmartWalletActivation,
  tx,
  gasOverrides,
  onChangeGasOverrides,
  sponsorMetadata,
}: DappRequestFooterProps): JSX.Element {
  const isGasFeeOverridesEnabled = useFeatureFlag(FeatureFlags.GasFeeOverrides)
  // Sponsored userOps have no editable gas — the paymaster pays — so force the
  // sponsor row even when GasFeeOverrides is on.
  const showOverrideRow =
    !sponsorMetadata && isGasFeeOverridesEnabled && isGasBearingMethod(requestMethod) && Boolean(gasFee)

  return (
    <>
      {/* Warning Banner (only shown if there's a risk) */}
      <TransactionWarningBanner riskLevel={riskLevel} confirmedRisk={confirmedRisk} onConfirmRisk={onConfirmRisk} />

      {/* Network Cost — gas-overrides Network cost row replaces the legacy
          fee footer when the urgency UI is on. */}
      {showOverrideRow && onChangeGasOverrides ? (
        <DappNetworkCostRow
          chainId={chainId}
          gasFee={gasFee}
          tx={tx}
          showSmartWalletActivation={showSmartWalletActivation}
          gasOverrides={gasOverrides}
          onChangeGasOverrides={onChangeGasOverrides}
        />
      ) : (
        (gasFee || sponsorMetadata) && (
          <NetworkFeeFooter
            chainId={chainId}
            gasFee={gasFee}
            showNetworkLogo={!!gasFee?.value}
            requestMethod={requestMethod}
            showSmartWalletActivation={showSmartWalletActivation}
            sponsorMetadata={sponsorMetadata}
          />
        )
      )}

      {/* Wallet Line Item */}
      <Flex px="$spacing8" mb="$spacing4">
        <DappWalletLineItem activeAccountAddress={account} />
      </Flex>
    </>
  )
}
