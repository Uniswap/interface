import { useContractKit, useProvider } from '@celo-tools/use-contractkit'
import { ChainId, Trade } from '@ubeswap/sdk'
import useENS from 'hooks/useENS'
import { SwapCallbackState, useSwapCallback } from 'hooks/useSwapCallback'
import { useMemo } from 'react'

import { INITIAL_ALLOWED_SLIPPAGE } from '../../../constants'
import { isAddress, shortenAddress } from '../../../utils'
import { useDoTransaction } from '.'
import { executeMinimaTrade } from './minima/executeMinimaTrade'
import { executeMoolaDirectTrade } from './moola/executeMoolaDirectTrade'
import { MoolaDirectTrade } from './moola/MoolaDirectTrade'
import { MinimaRouterTrade } from './trade'
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
  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const withRecipient =
    recipient === account
      ? ''
      : ` to ${
          recipientAddressOrName && isAddress(recipientAddressOrName)
            ? shortenAddress(recipientAddressOrName)
            : recipientAddressOrName
        }`

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
    if (trade instanceof MinimaRouterTrade) {
      return {
        state: SwapCallbackState.VALID,
        callback: async () => (await executeMinimaTrade({ ...env, trade, recipient, withRecipient })).hash,
        error: null,
      }
    } else if (trade instanceof MoolaDirectTrade) {
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
  }, [error, library, trade, account, chainId, doTransaction, swapCallback, swapState, recipient, withRecipient])
}
