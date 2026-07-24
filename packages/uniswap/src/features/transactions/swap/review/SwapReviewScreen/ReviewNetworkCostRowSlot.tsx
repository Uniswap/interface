import type { GasFeeResult } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useGasFeeFormattedDisplayAmounts } from 'uniswap/src/features/gas/hooks'
import { useIncludesDelegationUpgrade } from 'uniswap/src/features/smartWallet/delegation/hooks/useIncludesDelegationUpgrade'
import { ReviewNetworkCostRow } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/ReviewNetworkCostRow'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

/**
 * Renders the gas-overrides Network cost row in place of the default <NetworkFee />
 */
export function ReviewNetworkCostRowSlot({
  chainId,
  gasFee,
  tx,
  includesDelegation,
}: {
  chainId: UniverseChainId
  gasFee: GasFeeResult
  tx: ValidatedTransactionRequest | undefined
  includesDelegation?: boolean
}): JSX.Element {
  const { gasFeeFormatted } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: '-',
    includesDelegation,
  })
  const includesDelegationUpgrade = useIncludesDelegationUpgrade({ chainId, includesDelegation })
  return (
    <ReviewNetworkCostRow
      gasFeeUsd={gasFeeFormatted}
      tx={tx}
      includesDelegation={includesDelegation}
      includesDelegationUpgrade={includesDelegationUpgrade}
    />
  )
}
