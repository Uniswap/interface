// eslint-disable-next-line no-restricted-imports
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useENS from 'hooks/useENS'
import { SignatureData } from 'hooks/useERC20Permit'
import { AnyTrade, useSwapCallArguments } from 'hooks/useSwapCallArguments'
import { ReactNode, useMemo } from 'react'

import useSendSwapTransaction from './useSendSwapTransaction'

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null | undefined, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined,
  deadline: BigNumber | undefined
): { state: SwapCallbackState; callback: null | (() => Promise<TransactionResponse>); error: ReactNode | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName, signatureData, deadline)
  const { callback } = useSendSwapTransaction(account, chainId, library, trade, swapCalls)

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId || !callback) {
      return { state: SwapCallbackState.INVALID, callback: null, error: <Trans>Missing dependencies</Trans> }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: <Trans>Invalid recipient</Trans> }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<TransactionResponse> {
        return callback().then((response) => {
          return response
        })
      },
      error: null,
    }
  }, [trade, library, account, chainId, callback, recipient, recipientAddressOrName])
}
