import { Interface } from '@ethersproject/abi'
import { BigintIsh } from '@uniswap/sdk-core'
import { abi } from '@uniswap/swap-router-contracts/artifacts/contracts/interfaces/IMulticallExtended.sol/IMulticallExtended.json'
import { Multicall, toHex } from '@uniswap/v3-sdk'

// deadline or previousBlockhash
export type Validation = BigintIsh | string

function validateAndParseBytes32(bytes32: string): string {
  if (!bytes32.match(/^0x[0-9a-fA-F]{64}$/)) {
    throw new Error(`${bytes32} is not valid bytes32.`)
  }

  return bytes32.toLowerCase()
}

export abstract class MulticallExtended {
  public static INTERFACE: Interface = new Interface(abi)

  /**
   * Cannot be constructed.
   */
  private constructor() {}

  public static encodeMulticall(calldatas: string | string[], validation?: Validation): string {
    // if there's no validation, we can just fall back to regular multicall
    if (typeof validation === 'undefined') {
      return Multicall.encodeMulticall(calldatas)
    }

    // if there is validation, we have to normalize calldatas
    if (!Array.isArray(calldatas)) {
      calldatas = [calldatas]
    }

    // this means the validation value should be a previousBlockhash
    if (typeof validation === 'string' && validation.startsWith('0x')) {
      const previousBlockhash = validateAndParseBytes32(validation)
      return MulticallExtended.INTERFACE.encodeFunctionData('multicall(bytes32,bytes[])', [
        previousBlockhash,
        calldatas,
      ])
    } else {
      const deadline = toHex(validation)
      return MulticallExtended.INTERFACE.encodeFunctionData('multicall(uint256,bytes[])', [deadline, calldatas])
    }
  }
}
