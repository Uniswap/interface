import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { ChainId, Trade } from '@ubeswap/sdk'
import { SwapCallbackState, useSwapCallback } from 'hooks/useSwapCallback'
import { useMemo } from 'react'

import { INITIAL_ALLOWED_SLIPPAGE } from '../../../constants'
import { useDoTransaction } from '.'
import { executeMoolaDirectTrade } from './moola/executeMoolaDirectTrade'
import { MoolaDirectTrade } from './moola/MoolaDirectTrade'

/**
 * Use callback to allow trading
 * @param trade
 * @param allowedSlippage
 * @param recipientAddressOrName
 * @returns
 */
export const useTradeCallback = (
  trade: Trade | undefined, // trade to execute, required
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } => {
  const { address: account, network } = useContractKit()
  const library = useProvider()
  const chainId = network.chainId as unknown as ChainId
  const doTransaction = useDoTransaction()

  const {
    state: swapState,
    callback: swapCallback,
    error,
  } = useSwapCallback(trade, allowedSlippage, recipientAddressOrName)

  return useMemo(() => {
    if (error) {
      return { state: swapState, callback: null, error }
    }

    if (!library || !trade || !account) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }

    if (chainId === ChainId.BAKLAVA) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Baklava is not supported' }
    }

    const signer = library.getSigner(account)
    const env = { signer, chainId, doTransaction }
    if (trade instanceof MoolaDirectTrade) {
      return {
        state: SwapCallbackState.VALID,
        callback: async () => (await executeMoolaDirectTrade({ ...env, trade })).hash,
        error: null,
      }
    } else if (swapCallback) {
      return { state: SwapCallbackState.VALID, callback: swapCallback, error: null }
    } else {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Unknown trade type' }
    }
  }, [swapCallback, library, chainId, doTransaction, trade, account, error, swapState])
}
