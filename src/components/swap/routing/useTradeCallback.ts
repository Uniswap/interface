import { ChainId, Trade } from '@ubeswap/sdk'
import { useActiveWeb3React } from 'hooks'
import { SwapCallbackState, useSwapCallback } from 'hooks/useSwapCallback'
import { useCallback } from 'react'
import { useDoTransaction } from '.'
import { INITIAL_ALLOWED_SLIPPAGE } from '../../../constants'
import { executeMoolaTrade } from './moola/executeMoolaTrade'
import { MoolaTrade } from './moola/MoolaTrade'

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
  const { library, chainId, account } = useActiveWeb3React()
  const doTransaction = useDoTransaction()

  const { state: swapState, callback: swapCallback, error } = useSwapCallback(
    trade,
    allowedSlippage,
    recipientAddressOrName
  )

  const tradeCallback = useCallback(async () => {
    if (!library || !trade || !account) {
      throw new Error('not loaded')
    }

    if (chainId === ChainId.BAKLAVA) {
      throw new Error('Baklava is not supported')
    }

    const signer = library.getSigner(account)
    const env = { signer, chainId, doTransaction }
    if (trade instanceof MoolaTrade) {
      return (await executeMoolaTrade({ ...env, trade })).hash
    } else if (swapCallback) {
      return await swapCallback()
    } else {
      throw new Error('not loaded')
    }
  }, [swapCallback, library, chainId, doTransaction, trade, account])

  return { state: swapState, callback: tradeCallback, error }
}
