/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { BytesLike } from '@ethersproject/bytes'
import { CallOverrides } from '@ethersproject/contracts'
import SwapRouter02Json from '@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json'
import { MockContract, MockContractInterface } from 'metamocks'

import { SwapRouter02 } from '../../../src/types/v3/SwapRouter02'

export default class SwapRouter02Handler
  extends MockContract<SwapRouter02>
  implements MockContractInterface<SwapRouter02>
{
  abi = SwapRouter02Json.abi

  'checkOracleSlippage(bytes,uint24,uint32)'(
    path: BytesLike,
    maximumTickDivergence: BigNumberish,
    secondsAgo: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'checkOracleSlippage(bytes[],uint128[],uint24,uint32)'(
    paths: BytesLike[],
    amounts: BigNumberish[],
    maximumTickDivergence: BigNumberish,
    secondsAgo: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'multicall(bytes32,bytes[])'(
    previousBlockhash: BytesLike,
    data: BytesLike[],
    overrides: CallOverrides | undefined
  ): Promise<string[]> {
    return Promise.resolve([])
  }

  'multicall(bytes[])'(data: BytesLike[], overrides: CallOverrides | undefined): Promise<string[]> {
    return Promise.resolve([])
  }

  'multicall(uint256,bytes[])'(
    deadline: BigNumberish,
    data: BytesLike[],
    overrides: CallOverrides | undefined
  ): Promise<string[]> {
    console.log('someone called me!')
    data.forEach((d) => {
      this.handleCall(d)
    })
    return Promise.resolve([])
  }

  'sweepToken(address,uint256)'(
    token: string,
    amountMinimum: BigNumberish,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'sweepToken(address,uint256,address)'(
    token: string,
    amountMinimum: BigNumberish,
    recipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'sweepTokenWithFee(address,uint256,address,uint256,address)'(
    token: string,
    amountMinimum: BigNumberish,
    recipient: string,
    feeBips: BigNumberish,
    feeRecipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'sweepTokenWithFee(address,uint256,uint256,address)'(
    token: string,
    amountMinimum: BigNumberish,
    feeBips: BigNumberish,
    feeRecipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'unwrapWETH9(uint256)'(amountMinimum: BigNumberish, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  'unwrapWETH9(uint256,address)'(
    amountMinimum: BigNumberish,
    recipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'unwrapWETH9WithFee(uint256,address,uint256,address)'(
    amountMinimum: BigNumberish,
    recipient: string,
    feeBips: BigNumberish,
    feeRecipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  'unwrapWETH9WithFee(uint256,uint256,address)'(
    amountMinimum: BigNumberish,
    feeBips: BigNumberish,
    feeRecipient: string,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  WETH9(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve('')
  }

  approveMax(token: string, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  approveMaxMinusOne(token: string, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  approveZeroThenMax(token: string, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  approveZeroThenMaxMinusOne(token: string, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  callPositionManager(data: BytesLike, overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve('')
  }

  exactInput(
    params: {
      path: BytesLike
      recipient: string
      amountIn: BigNumberish
      amountOutMinimum: BigNumberish
    },
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(undefined)
  }

  exactInputSingle(
    params: {
      tokenIn: string
      tokenOut: string
      fee: BigNumberish
      recipient: string
      amountIn: BigNumberish
      amountOutMinimum: BigNumberish
      sqrtPriceLimitX96: BigNumberish
    },
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    console.log({ params })
    return Promise.resolve(undefined)
  }

  exactOutput(
    params: {
      path: BytesLike
      recipient: string
      amountOut: BigNumberish
      amountInMaximum: BigNumberish
    },
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(undefined)
  }

  exactOutputSingle(
    params: {
      tokenIn: string
      tokenOut: string
      fee: BigNumberish
      recipient: string
      amountOut: BigNumberish
      amountInMaximum: BigNumberish
      sqrtPriceLimitX96: BigNumberish
    },
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(undefined)
  }

  factory(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve('')
  }

  factoryV2(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve('')
  }

  getApprovalType(token: string, amount: BigNumberish, overrides: CallOverrides | undefined): Promise<number> {
    return Promise.resolve(0)
  }

  increaseLiquidity(
    params: {
      token0: string
      token1: string
      tokenId: BigNumberish
      amount0Min: BigNumberish
      amount1Min: BigNumberish
    },
    overrides: CallOverrides | undefined
  ): Promise<string> {
    return Promise.resolve('')
  }

  mint(
    params: {
      token0: string
      token1: string
      fee: BigNumberish
      tickLower: BigNumberish
      tickUpper: BigNumberish
      amount0Min: BigNumberish
      amount1Min: BigNumberish
      recipient: string
    },
    overrides: CallOverrides | undefined
  ): Promise<string> {
    return Promise.resolve('')
  }

  positionManager(overrides: CallOverrides | undefined): Promise<string> {
    return Promise.resolve('')
  }

  pull(token: string, value: BigNumberish, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  refundETH(overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }

  selfPermit(
    token: string,
    value: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  selfPermitAllowed(
    token: string,
    nonce: BigNumberish,
    expiry: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  selfPermitAllowedIfNecessary(
    token: string,
    nonce: BigNumberish,
    expiry: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  selfPermitIfNecessary(
    token: string,
    value: BigNumberish,
    deadline: BigNumberish,
    v: BigNumberish,
    r: BytesLike,
    s: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  swapExactTokensForTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(undefined)
  }

  swapTokensForExactTokens(
    amountOut: BigNumberish,
    amountInMax: BigNumberish,
    path: string[],
    to: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(undefined)
  }

  uniswapV3SwapCallback(
    amount0Delta: BigNumberish,
    amount1Delta: BigNumberish,
    _data: BytesLike,
    overrides: CallOverrides | undefined
  ): Promise<void> {
    return Promise.resolve(undefined)
  }

  wrapETH(value: BigNumberish, overrides: CallOverrides | undefined): Promise<void> {
    return Promise.resolve(undefined)
  }
}
