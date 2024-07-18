import { SwapRouter } from '@uniswap/universal-router-sdk'
import { ethers } from 'ethers'
import {
  ABI_DEFINITION,
  CommandName,
  CommandType,
  Subparser,
  UniversalRouterCall,
  UniversalRouterCommand,
} from 'src/app/features/dappRequests/types/UniversalRouterTypes'

export function parseCalldata(calldata: string): UniversalRouterCall {
  const iface = SwapRouter.INTERFACE
  const txDescription = iface.parseTransaction({ data: calldata })
  const { commands, inputs } = txDescription.args
  // map hex string to bytes
  const commandTypes: CommandType[] = []

  // Start iterating from the third character to skip the "0x" prefix
  for (let i = 2; i < commands.length; i += 2) {
    // Get two characters from the hexString
    const byte = commands.substr(i, 2)

    // Convert it to a number and add it to the values array
    commandTypes.push(parseInt(byte, 16) as CommandType)
  }

  const parsedCommands = commandTypes.map((commandType: CommandType, i: number): UniversalRouterCommand => {
    const abiDef = ABI_DEFINITION[commandType]
    const rawParams = ethers.utils.defaultAbiCoder.decode(
      abiDef.map((command) => command.type),
      inputs[i],
    )
    const params = rawParams.map((param, j: number) => {
      const fragment = abiDef[j]
      if (fragment && fragment.subparser === Subparser.V3PathExactIn) {
        return {
          name: fragment.name,
          value: parseV3PathExactIn(param),
        }
      } else if (fragment && fragment.subparser === Subparser.V3PathExactOut) {
        return {
          name: fragment.name,
          value: parseV3PathExactOut(param),
        }
      } else {
        return {
          name: fragment?.name || '',
          value: param,
        }
      }
    })
    return {
      commandName: CommandType[commandType] as CommandName,
      commandType,
      params,
    }
  })
  return { commands: parsedCommands }
}

export type V3PathItem = {
  readonly tokenIn: string
  readonly tokenOut: string
  readonly fee: number
}

export function parseV3PathExactIn(path: string): readonly V3PathItem[] {
  const strippedPath = path.replace('0x', '')
  let tokenIn = ethers.utils.getAddress(strippedPath.substr(0, 40))
  let loc = 40
  const res = []
  while (loc < strippedPath.length) {
    const feeAndTokenOut = strippedPath.substr(loc, 46)
    const fee = parseInt(feeAndTokenOut.substr(0, 6), 16)
    const tokenOut = ethers.utils.getAddress(feeAndTokenOut.substr(6, 40))

    res.push({
      tokenIn,
      tokenOut,
      fee,
    })
    tokenIn = tokenOut
    loc += 46
  }

  return res
}

export function parseV3PathExactOut(path: string): readonly V3PathItem[] {
  const strippedPath = path.replace('0x', '')
  let tokenIn = ethers.utils.getAddress(strippedPath.substr(strippedPath.length - 40, 40))
  let loc = strippedPath.length - 86 // 86 = (20 addr + 3 fee + 20 addr) * 2 (for hex characters)
  const res = []
  while (loc >= 0) {
    const feeAndTokenOut = strippedPath.substr(loc, 46)
    const tokenOut = ethers.utils.getAddress(feeAndTokenOut.substr(0, 40))
    const fee = parseInt(feeAndTokenOut.substr(40, 6), 16)

    res.push({
      tokenIn,
      tokenOut,
      fee,
    })
    tokenIn = tokenOut
    loc -= 46
  }

  return res
}
