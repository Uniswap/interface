import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Percent } from '@kinetix/sdk-core'
import { FeeOptions } from '@kinetix/v3-sdk'
import { t } from '@lingui/macro'
// import { OpenoceanApiSdk } from '@openocean.finance/api'
import { useWeb3React } from '@web3-react/core'
import { useTrace } from 'analytics'
import { ZERO_ADDRESS } from 'constants/misc'
import { getTokenAddress } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { ClassicTrade, TradeFillType } from 'state/routing/types'
import { trace } from 'tracing/trace'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

import { OPENOCEAN_ROUTER_ADDRESS } from './usePermit2Allowance'
import { PermitSignature } from './usePermitAllowance'

/** Thrown when gas estimation fails. This class of error usually requires an emulator to determine the root cause. */
class GasEstimationError extends Error {
  constructor() {
    super(t`Your swap is expected to fail.`)
  }
}

/**
 * Thrown when the user modifies the transaction in-wallet before submitting it.
 * In-wallet calldata modification nullifies any safeguards (eg slippage) from the interface, so we recommend reverting them immediately.
 */
class ModifiedSwapError extends Error {
  constructor() {
    super(
      t`Your swap was modified through your wallet. If this was a mistake, please cancel immediately or risk losing your funds.`
    )
  }
}

interface SwapOptions {
  slippageTolerance: Percent
  deadline?: BigNumber
  permit?: PermitSignature
  feeOptions?: FeeOptions
}

async function swapQuote(account: string, chainId: ChainId, data: any, value: any) {
  console.log('swapQuote', account, chainId, data, value)

  // const openoceanApiSdk = new OpenoceanApiSdk()
  // const { swapSdk } = openoceanApiSdk

  // const swapData = await swapSdk.swapQuote({
  //   chain: 'terra',
  //   inTokenAddress: 'uusd',
  //   outTokenAddress: 'terra13awdgcx40tz5uygkgm79dytez3x87rpg4uhnvu',
  //   amount: 0.01,
  //   slippage: 1,
  //   // account: this.wallet.address,
  //   // gasPrice: req.data.gasPrice,
  // })
  // if (swapData.code == 200) {
  //   swapSdk
  //     .swap(swapData.data)
  //     .on('error', (error: any) => {
  //       console.log(error)
  //     })
  //     .on('transactionHash', (hash: any) => {
  //       console.log(hash)
  //     })
  //     .on('receipt', (data: any) => {
  //       console.log(data)
  //     })
  //     .on('success', (data: any) => {
  //       console.log(data)
  //     })
  // } else {
  //   console.log(swapData.message)
  // }
}

// TODO KFI send swap quote transaction
export function useUniversalRouterSwapCallback(
  trade: ClassicTrade | undefined,
  fiatValues: { amountIn?: number; amountOut?: number },
  options: SwapOptions
) {
  const { account, chainId, provider } = useWeb3React()
  const analyticsContext = useTrace()
  console.log('useUniversalRouterSwapCallback')

  return useCallback(async () => {
    return trace('swap.send', async ({ setTraceData, setTraceStatus, setTraceError }) => {
      console.log('useUniversalRouterSwapCallback useCallback')
      try {
        if (!account) throw new Error('missing account')
        if (!chainId) throw new Error('missing chainId')
        if (!provider) throw new Error('missing provider')
        if (!trade) throw new Error('missing trade')
        const connectedChainId = await provider.getSigner().getChainId()
        if (chainId !== connectedChainId) throw new Error('signer chainId does not match')
        console.log('useUniversalRouterSwapCallback try')

        const tokenInAddress = trade.inputAmount.currency.isNative
          ? ZERO_ADDRESS
          : getTokenAddress(trade.inputAmount.currency)

        const tokenOutAddress = trade.outputAmount.currency.isNative
          ? ZERO_ADDRESS
          : getTokenAddress(trade.outputAmount.currency)

        const amount = trade.inputAmount.toExact()

        console.log('useUniversalRouterSwapCallback', tokenInAddress, tokenOutAddress)

        const res = await fetch(
          `https://open-api.openocean.finance/v3/kava/swap_quote?inTokenAddress=${tokenInAddress}&outTokenAddress=${tokenOutAddress}&amount=${amount}&gasPrice=1.2&slippage=10&account=${account}`
        )
        const result = await res.json()
        const { estimatedGas, data, gasPrice } = result.data
        const value = trade.inputAmount.currency.isNative ? trade.inputAmount.quotient.toString() : '0'

        const tx = {
          from: account,
          to: OPENOCEAN_ROUTER_ADDRESS,
          gasLimit: estimatedGas,
          data,
          gasPrice,
          value,
        }

        const response = await provider
          .getSigner()
          .sendTransaction(tx)
          .then((response) => {
            if (tx.data !== response.data) {
              throw new ModifiedSwapError()
            }
            return response
          })
        return {
          type: TradeFillType.Classic as const,
          response,
        }
      } catch (swapError: unknown) {
        if (swapError instanceof ModifiedSwapError) throw swapError

        if (!(swapError instanceof GasEstimationError)) setTraceError(swapError)

        // Cancellations are not failures, and must be accounted for as 'cancelled'.
        if (didUserReject(swapError)) {
          setTraceStatus('cancelled')
          // This error type allows us to distinguish between user rejections and other errors later too.
          throw new UserRejectedRequestError(swapErrorToUserReadableMessage(swapError))
        }

        throw new Error(swapErrorToUserReadableMessage(swapError))
      }
    })
  }, [
    account,
    analyticsContext,
    chainId,
    fiatValues,
    options.deadline,
    options.feeOptions,
    options.permit,
    options.slippageTolerance,
    provider,
    trade,
  ])
}
