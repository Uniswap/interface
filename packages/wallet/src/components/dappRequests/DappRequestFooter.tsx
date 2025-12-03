import { Flex } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { DappWalletLineItem } from 'wallet/src/components/dappRequests/DappWalletLineItem'
import { TransactionWarningBanner } from 'wallet/src/components/dappRequests/TransactionWarningBanner'
import type { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { NetworkFeeFooter } from 'wallet/src/features/transactions/TransactionRequest/NetworkFeeFooter'

interface DappRequestFooterProps {
  chainId: UniverseChainId
  account: string
  riskLevel: TransactionRiskLevel
  confirmedRisk?: boolean
  onConfirmRisk?: (confirmed: boolean) => void
  gasFee?: GasFeeResult
  requestMethod?: string
  showSmartWalletActivation?: boolean
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
}: DappRequestFooterProps): JSX.Element {
  return (
    <>
      {/* Warning Banner (only shown if there's a risk) */}
      <TransactionWarningBanner riskLevel={riskLevel} confirmedRisk={confirmedRisk} onConfirmRisk={onConfirmRisk} />

      {/* Network Cost */}
      {gasFee && (
        <NetworkFeeFooter
          chainId={chainId}
          gasFee={gasFee}
          showNetworkLogo={!!gasFee.value}
          requestMethod={requestMethod}
          showSmartWalletActivation={showSmartWalletActivation}
        />
      )}

      {/* Wallet Line Item */}
      <Flex px="$spacing8" mb="$spacing4">
        <DappWalletLineItem activeAccountAddress={account} />
      </Flex>
    </>
  )
}
