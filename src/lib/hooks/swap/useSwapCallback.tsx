// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { BigNumber } from 'ethers/node_modules/@ethersproject/abstract-signer/node_modules/@ethersproject/bignumber'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useENS from 'hooks/useENS'
import { SignatureData } from 'hooks/useERC20Permit'
import { useSwapCallArguments } from 'hooks/useSwapCallArguments'
import { useAtomValue } from 'jotai/utils'
import { transactionTtlAtom } from 'lib/state/settings'
import { ReactNode, useMemo } from 'react'

import useActiveWeb3React from '../useActiveWeb3React'
import useSendSwapTransaction from './useSendSwapTransaction'

export type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: ReactNode | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const currentBlockTimestamp = useCurrentBlockTimestamp()
  const userDeadline = useAtomValue(transactionTtlAtom)
  const deadline = currentBlockTimestamp?.add(BigNumber.from(userDeadline))

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
      callback: async function onSwap(): Promise<string> {
        return callback().then((response) => {
          return response.hash
        })
      },
      error: null,
    }
  }, [trade, library, account, chainId, callback, recipient, recipientAddressOrName])
}
