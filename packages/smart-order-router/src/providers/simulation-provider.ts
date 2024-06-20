import { JsonRpcProvider } from '@ethersproject/providers'
import { ChainId, TradeType } from '@ubeswap/sdk-core'
import { PERMIT2_ADDRESS } from '@uniswap/universal-router-sdk'
import { BigNumber } from 'ethers/lib/ethers'

import { SwapOptions, SwapRoute, SwapType } from '../routers'
import { Erc20__factory } from '../types/other/factories/Erc20__factory'
import { Permit2__factory } from '../types/other/factories/Permit2__factory'
import { CurrencyAmount, SWAP_ROUTER_02_ADDRESSES, log } from '../util'

import { IPortionProvider } from './portion-provider'
import { ProviderConfig } from './provider'
import { ArbitrumGasData, OptimismGasData } from './v3/gas-data-provider'

export type SimulationResult = {
  transaction: { hash: string; gas_used: number; gas: number; error_message: string }
  simulation: { state_overrides: Record<string, unknown> }
}

export enum SimulationStatus {
  NotSupported = 0,
  Failed = 1,
  Succeeded = 2,
  InsufficientBalance = 3,
  NotApproved = 4,
}

/**
 * Provider for dry running transactions.
 *
 * @export
 * @class Simulator
 */
export abstract class Simulator {
  protected provider: JsonRpcProvider
  protected portionProvider: IPortionProvider

  /**
   * Returns a new SwapRoute with simulated gas estimates
   * @returns SwapRoute
   */
  constructor(provider: JsonRpcProvider, portionProvider: IPortionProvider, protected chainId: ChainId) {
    this.provider = provider
    this.portionProvider = portionProvider
  }

  public async simulate(
    fromAddress: string,
    swapOptions: SwapOptions,
    swapRoute: SwapRoute,
    amount: CurrencyAmount,
    quote: CurrencyAmount,
    l2GasData?: OptimismGasData | ArbitrumGasData,
    providerConfig?: ProviderConfig
  ): Promise<SwapRoute> {
    if (await this.userHasSufficientBalance(fromAddress, swapRoute.trade.tradeType, amount, quote)) {
      log.info('User has sufficient balance to simulate. Simulating transaction.')
      try {
        return this.simulateTransaction(fromAddress, swapOptions, swapRoute, l2GasData, providerConfig)
      } catch (e) {
        log.error({ e }, 'Error simulating transaction')
        return {
          ...swapRoute,
          simulationStatus: SimulationStatus.Failed,
        }
      }
    } else {
      log.error('User does not have sufficient balance to simulate.')
      return {
        ...swapRoute,
        simulationStatus: SimulationStatus.InsufficientBalance,
      }
    }
  }

  protected abstract simulateTransaction(
    fromAddress: string,
    swapOptions: SwapOptions,
    swapRoute: SwapRoute,
    l2GasData?: OptimismGasData | ArbitrumGasData,
    providerConfig?: ProviderConfig
  ): Promise<SwapRoute>

  protected async userHasSufficientBalance(
    fromAddress: string,
    tradeType: TradeType,
    amount: CurrencyAmount,
    quote: CurrencyAmount
  ): Promise<boolean> {
    try {
      const neededBalance = tradeType == TradeType.EXACT_INPUT ? amount : quote
      let balance
      if (neededBalance.currency.isNative) {
        balance = await this.provider.getBalance(fromAddress)
      } else {
        const tokenContract = Erc20__factory.connect(neededBalance.currency.address, this.provider)
        balance = await tokenContract.balanceOf(fromAddress)
      }

      const hasBalance = balance.gte(BigNumber.from(neededBalance.quotient.toString()))
      log.info(
        {
          fromAddress,
          balance: balance.toString(),
          neededBalance: neededBalance.quotient.toString(),
          neededAddress: neededBalance.wrapped.currency.address,
          hasBalance,
        },
        'Result of balance check for simulation'
      )
      return hasBalance
    } catch (e) {
      log.error(e, 'Error while checking user balance')
      return false
    }
  }

  protected async checkTokenApproved(
    fromAddress: string,
    inputAmount: CurrencyAmount,
    swapOptions: SwapOptions,
    provider: JsonRpcProvider
  ): Promise<boolean> {
    // Check token has approved Permit2 more than expected amount.
    const tokenContract = Erc20__factory.connect(inputAmount.currency.wrapped.address, provider)

    if (swapOptions.type == SwapType.UNIVERSAL_ROUTER) {
      const permit2Allowance = await tokenContract.allowance(fromAddress, PERMIT2_ADDRESS)

      // If a permit has been provided we don't need to check if UR has already been allowed.
      if (swapOptions.inputTokenPermit) {
        log.info(
          {
            permitAllowance: permit2Allowance.toString(),
            inputAmount: inputAmount.quotient.toString(),
          },
          'Permit was provided for simulation on UR, checking that Permit2 has been approved.'
        )
        return permit2Allowance.gte(BigNumber.from(inputAmount.quotient.toString()))
      }

      // Check UR has been approved from Permit2.
      const permit2Contract = Permit2__factory.connect(PERMIT2_ADDRESS, provider)

      const { amount: universalRouterAllowance, expiration: tokenExpiration } = await permit2Contract.allowance(
        fromAddress,
        inputAmount.currency.wrapped.address,
        SWAP_ROUTER_02_ADDRESSES(this.chainId)
      )

      const nowTimestampS = Math.round(Date.now() / 1000)
      const inputAmountBN = BigNumber.from(inputAmount.quotient.toString())

      const permit2Approved = permit2Allowance.gte(inputAmountBN)
      const universalRouterApproved = universalRouterAllowance.gte(inputAmountBN)
      const expirationValid = tokenExpiration > nowTimestampS
      log.info(
        {
          permitAllowance: permit2Allowance.toString(),
          tokenAllowance: universalRouterAllowance.toString(),
          tokenExpirationS: tokenExpiration,
          nowTimestampS,
          inputAmount: inputAmount.quotient.toString(),
          permit2Approved,
          universalRouterApproved,
          expirationValid,
        },
        `Simulating on UR, Permit2 approved: ${permit2Approved}, UR approved: ${universalRouterApproved}, Expiraton valid: ${expirationValid}.`
      )
      return permit2Approved && universalRouterApproved && expirationValid
    } else if (swapOptions.type == SwapType.SWAP_ROUTER_02) {
      if (swapOptions.inputTokenPermit) {
        log.info(
          {
            inputAmount: inputAmount.quotient.toString(),
          },
          'Simulating on SwapRouter02 info - Permit was provided for simulation. Not checking allowances.'
        )
        return true
      }

      const allowance = await tokenContract.allowance(fromAddress, SWAP_ROUTER_02_ADDRESSES(this.chainId))
      const hasAllowance = allowance.gte(BigNumber.from(inputAmount.quotient.toString()))
      log.info(
        {
          hasAllowance,
          allowance: allowance.toString(),
          inputAmount: inputAmount.quotient.toString(),
        },
        `Simulating on SwapRouter02 - Has allowance: ${hasAllowance}`
      )
      // Return true if token allowance is greater than input amount
      return hasAllowance
    }

    throw new Error(`Unsupported swap type ${swapOptions}`)
  }
}
