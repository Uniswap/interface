import { Interface } from '@ethersproject/abi'
import { Percent, Token, validateAndParseAddress } from '@uniswap/sdk-core'
import { abi } from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/IPeripheryPaymentsWithFeeExtended.sol/IPeripheryPaymentsWithFeeExtended.json'
import { FeeOptions, Payments, toHex } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'

function encodeFeeBips(fee: Percent): string {
  return toHex(fee.multiply(10_000).quotient)
}

export abstract class PaymentsExtended {
  public static INTERFACE: Interface = new Interface(abi)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeUnwrapWETH9(amountMinimum: JSBI, recipient?: string, feeOptions?: FeeOptions): string {
    // if there's a recipient, just pass it along
    if (typeof recipient === 'string') {
      return Payments.encodeUnwrapWETH9(amountMinimum, recipient, feeOptions)
    }

    if (!!feeOptions) {
      const feeBips = encodeFeeBips(feeOptions.fee)
      const feeRecipient = validateAndParseAddress(feeOptions.recipient)

      return PaymentsExtended.INTERFACE.encodeFunctionData('unwrapWETH9WithFee(uint256,uint256,address)', [
        toHex(amountMinimum),
        feeBips,
        feeRecipient,
      ])
    } else {
      return PaymentsExtended.INTERFACE.encodeFunctionData('unwrapWETH9(uint256)', [toHex(amountMinimum)])
    }
  }

  public static encodeSweepToken(
    token: Token,
    amountMinimum: JSBI,
    recipient?: string,
    feeOptions?: FeeOptions
  ): string {
    // if there's a recipient, just pass it along
    if (typeof recipient === 'string') {
      return Payments.encodeSweepToken(token, amountMinimum, recipient, feeOptions)
    }

    if (!!feeOptions) {
      const feeBips = encodeFeeBips(feeOptions.fee)
      const feeRecipient = validateAndParseAddress(feeOptions.recipient)

      return PaymentsExtended.INTERFACE.encodeFunctionData('sweepTokenWithFee(address,uint256,uint256,address)', [
        token.address,
        toHex(amountMinimum),
        feeBips,
        feeRecipient,
      ])
    } else {
      return PaymentsExtended.INTERFACE.encodeFunctionData('sweepToken(address,uint256)', [
        token.address,
        toHex(amountMinimum),
      ])
    }
  }

  public static encodePull(token: Token, amount: JSBI): string {
    return PaymentsExtended.INTERFACE.encodeFunctionData('pull', [token.address, toHex(amount)])
  }

  public static encodeWrapETH(amount: JSBI): string {
    return PaymentsExtended.INTERFACE.encodeFunctionData('wrapETH', [toHex(amount)])
  }
}
