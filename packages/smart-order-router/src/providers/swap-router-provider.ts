import { ChainId, Currency, CurrencyAmount } from '@ubeswap/sdk-core'
import { ApprovalTypes } from '@uniswap/router-sdk'

import { SwapRouter02__factory } from '../types/other/factories/SwapRouter02__factory'
import { log, SWAP_ROUTER_02_ADDRESSES } from '../util'

import { IMulticallProvider } from './multicall-provider'

type TokenApprovalTypes = {
  approvalTokenIn: ApprovalTypes
  approvalTokenOut: ApprovalTypes
}

/**
 * Provider for accessing the SwapRouter02 Contract .
 *
 * @export
 * @interface IRouterProvider
 */
export interface ISwapRouterProvider {
  /**
   * Get the approval method needed for each token. Throws an error if either query fails.
   *
   * @param tokenInAmount The Currency Amount of tokenIn needed by the user
   * @param tokenOutAmount The Currency Amount of tokenOut needed by the user
   * @returns the Approval Types for each token.
   */
  getApprovalType(
    tokenInAmount: CurrencyAmount<Currency>,
    tokenOutAmount: CurrencyAmount<Currency>
  ): Promise<TokenApprovalTypes>
}

export class SwapRouterProvider implements ISwapRouterProvider {
  constructor(protected multicall2Provider: IMulticallProvider, protected chainId: ChainId) {}

  public async getApprovalType(
    tokenInAmount: CurrencyAmount<Currency>,
    tokenOutAmount: CurrencyAmount<Currency>
  ): Promise<TokenApprovalTypes> {
    const functionParams: [string, string][] = [
      [tokenInAmount.currency.wrapped.address, tokenInAmount.quotient.toString()],
      [tokenOutAmount.currency.wrapped.address, tokenOutAmount.quotient.toString()],
    ]

    const tx = await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams<
      [string, string],
      [ApprovalTypes]
    >({
      address: SWAP_ROUTER_02_ADDRESSES(this.chainId),
      contractInterface: SwapRouter02__factory.createInterface(),
      functionName: 'getApprovalType',
      functionParams,
    })

    if (!tx.results[0]?.success || !tx.results[1]?.success) {
      log.info({ results: tx.results }, 'Failed to get approval type from swap router for token in or token out')
      throw new Error('Failed to get approval type from swap router for token in or token out')
    }

    const { result: approvalTokenIn } = tx.results![0]
    const { result: approvalTokenOut } = tx.results![1]

    return {
      approvalTokenIn: approvalTokenIn[0],
      approvalTokenOut: approvalTokenOut[0],
    }
  }
}
