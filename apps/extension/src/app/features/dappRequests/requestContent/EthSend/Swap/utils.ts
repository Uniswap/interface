import { BigNumber, BigNumberish } from 'ethers'
import { formatUnits as formatUnitsEthers } from 'ethers/lib/utils'
import {
  CONTRACT_BALANCE,
  MAX_UINT160,
  MAX_UINT256,
} from 'src/app/features/dappRequests/requestContent/EthSend/Swap/constants'
import { CommandType, UniversalRouterCall } from 'src/app/features/dappRequests/types/UniversalRouterTypes'

export type MinimalToken = {
  address: string
  symbol: string
  decimals: number
}
export type TokenDetails = { [address: string]: MinimalToken }

export type V3TokenInPath = {
  tokenIn: string
  tokenOut: string
  fee: number
}

export function findErc20TokensToPrepare(urCall: UniversalRouterCall): string[] {
  const tokenAddresses: string[] = []
  urCall.commands.forEach((command) => {
    switch (command.commandType) {
      case CommandType.V2SwapExactIn:
      case CommandType.V2SwapExactOut: {
        const tokensInPath: string[] | undefined = command.params.find((param) => param.name === 'path')?.value
        tokensInPath?.forEach((tokenAddr: string) => tokenAddresses.push(tokenAddr))
        break
      }
      case CommandType.V3SwapExactIn:
      case CommandType.V3SwapExactOut: {
        const pools: V3TokenInPath[] | undefined = command.params.find((param) => param.name === 'path')?.value
        pools?.forEach(({ tokenIn, tokenOut }) => {
          tokenAddresses.push(tokenIn)
          tokenAddresses.push(tokenOut)
        })
        break
      }
      case CommandType.PayPortion:
      case CommandType.SWEEP:
      case CommandType.TRANSFER: {
        const tokenAddr = command.params.find((param) => param.name === 'token')?.value
        if (tokenAddr) {
          tokenAddresses.push(tokenAddr)
        }
        break
      }
    }
  })

  return Array.from(new Set(tokenAddresses))
}

// Like ethers.formatUnits except it parses specific constants
export function formatUnits(amount: BigNumberish, units: number): string {
  if (BigNumber.from(CONTRACT_BALANCE).eq(amount)) {
    return 'CONTRACT_BALANCE'
  }
  if (BigNumber.from(MAX_UINT256).eq(amount)) {
    return 'MAX_UINT256'
  }
  if (BigNumber.from(MAX_UINT160).eq(amount)) {
    return 'MAX_UINT160'
  }

  return formatUnitsEthers(amount, units)
}
