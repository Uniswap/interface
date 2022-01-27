import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
export function swapErrorToUserReadableMessage(error: any): ReactNode {
  let reason: string | undefined
  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  switch (reason) {
    case 'UniswapV2Router: EXPIRED':
      return (
        <Trans>
          The transaction could not be sent because the deadline has passed. Please check that your transaction deadline
          is not too low.
        </Trans>
      )
    case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
      return (
        <Trans>
          This transaction will not succeed either due to price movement or fee on transfer. Try increasing your
          slippage tolerance.
        </Trans>
      )
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return <Trans>The input token cannot be transferred. There may be an issue with the input token.</Trans>
    case 'UniswapV2: TRANSFER_FAILED':
      return <Trans>The output token cannot be transferred. There may be an issue with the output token.</Trans>
    case 'UniswapV2: K':
      return (
        <Trans>
          The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are
          swapping incorporates custom behavior on transfer.
        </Trans>
      )
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return (
        <Trans>
          This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: fee on
          transfer and rebase tokens are incompatible with Uniswap V3.
        </Trans>
      )
    case 'TF':
      return (
        <Trans>
          The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and
          rebase tokens are incompatible with Uniswap V3.
        </Trans>
      )
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return (
          <Trans>
            An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If
            that does not work, there may be an incompatibility with the token you are trading. Note: fee on transfer
            and rebase tokens are incompatible with Uniswap V3.
          </Trans>
        )
      }
      return (
        <Trans>
          Unknown error{reason ? `: "${reason}"` : ''}. Try increasing your slippage tolerance. Note: fee on transfer
          and rebase tokens are incompatible with Uniswap V3.
        </Trans>
      )
  }
}
