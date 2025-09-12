/* eslint-disable max-depth */
/* eslint-disable complexity */
import { BigNumber, BigNumberish } from '@ethersproject/bignumber'
import { formatUnits as formatUnitsEthers } from 'ethers/lib/utils'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import {
  CONTRACT_BALANCE,
  MAX_UINT160,
  MAX_UINT256,
} from 'src/app/features/dappRequests/requestContent/EthSend/Swap/constants'
import {
  AmountInMaxParam,
  AmountInParam,
  AmountOutMinParam,
  AmountOutParam,
  isAmountInMaxParam,
  isAmountInParam,
  isAmountMinParam,
  isAmountOutMinParam,
  isAmountOutParam,
  isSettleParam,
  isURCommandASwap,
  isUrCommandSweep,
  isUrCommandUnwrapWeth,
  Param,
  UniversalRouterCall,
  UniversalRouterCommand,
  V4SwapExactInParamSchema,
  V4SwapExactInSingleParamSchema,
  V4SwapExactOutParamSchema,
  V4SwapExactOutSingleParamSchema,
} from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

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

export function useSwapDetails(
  parsedCalldata: UniversalRouterCall,
  dappUrl: string,
): {
  inputIdentifier: string | undefined
  outputIdentifier: string | undefined
  inputValue: string
  outputValue: string
} {
  const activeChain = useDappLastChainId(dappUrl)
  const commands = parsedCalldata.commands

  // Find first and last swap commands
  const firstSwapCommand = commands.find(isURCommandASwap)
  const lastSwapCommand = commands.findLast(isURCommandASwap)

  // Extract input details from first swap command
  const inputDetails = firstSwapCommand ? extractInputDetails(firstSwapCommand) : { address: undefined, value: '0' }

  // Extract output details from last swap command
  const outputDetails = lastSwapCommand
    ? extractOutputDetails(lastSwapCommand, commands)
    : { address: undefined, value: '0' }

  // Normalize addresses (handling ETH address)
  const inputAddress =
    inputDetails.address === DEFAULT_NATIVE_ADDRESS ? DEFAULT_NATIVE_ADDRESS_LEGACY : inputDetails.address
  const outputAddress =
    outputDetails.address === DEFAULT_NATIVE_ADDRESS ? DEFAULT_NATIVE_ADDRESS_LEGACY : outputDetails.address

  // Build currency identifiers
  const inputIdentifier = activeChain && inputAddress ? buildCurrencyId(activeChain, inputAddress) : undefined
  const outputIdentifier = activeChain && outputAddress ? buildCurrencyId(activeChain, outputAddress) : undefined

  return {
    inputIdentifier,
    outputIdentifier,
    inputValue: inputDetails.value,
    outputValue: outputDetails.value,
  }
}

// Predicate Functions
function isAmountInOrMaxParam(param: Param): param is AmountInParam | AmountInMaxParam {
  return isAmountInParam(param) || isAmountInMaxParam(param)
}

function isAmountOutMinOrOutParam(param: Param): param is AmountOutMinParam | AmountOutParam {
  return isAmountOutMinParam(param) || isAmountOutParam(param)
}

// Extract input details (address and value) from a swap command
function extractInputDetails(command: UniversalRouterCommand): { address: string | undefined; value: string } {
  // Default values
  let address: string | undefined
  let value = '0'

  // Handle V4 swap commands
  if (command.commandName === 'V4_SWAP') {
    const v4Details = getTokenDetailsFromV4SwapCommands(command)
    address = v4Details.inputAddress
    value = v4Details.inputValue || '0'
  }
  // Handle V2/V3 swap commands
  else if (command.commandName.startsWith('V2_SWAP') || command.commandName.startsWith('V3_SWAP')) {
    const addressDetails = getTokenAddressesFromV2V3SwapCommands(command)
    address = addressDetails.inputAddress

    const amountInParam = command.params.find(isAmountInOrMaxParam)
    value = amountInParam?.value || '0'
  }

  // Handle edge case where input amount is zero - look for SETTLE parameter
  if (address && isZeroBigNumberParam(value)) {
    value = getFallbackInputValue(command) || '0'
  }

  return { address, value }
}

// Extract output details (address and value) from a swap command
function extractOutputDetails(
  command: UniversalRouterCommand,
  allCommands: UniversalRouterCommand[],
): { address: string | undefined; value: string } {
  // Default values
  let address: string | undefined
  let value = '0'

  // Handle V4 swap commands
  if (command.commandName === 'V4_SWAP') {
    const v4Details = getTokenDetailsFromV4SwapCommands(command)
    address = v4Details.outputAddress
    value = v4Details.outputValue || '0'
  }
  // Handle V2/V3 swap commands
  else if (command.commandName.startsWith('V2_SWAP') || command.commandName.startsWith('V3_SWAP')) {
    const addressDetails = getTokenAddressesFromV2V3SwapCommands(command)
    address = addressDetails.outputAddress

    const amountOutParam = command.params.find(isAmountOutMinOrOutParam)
    value = amountOutParam?.value || '0'
  }

  // Handle special case where V3_SWAP command's amountOutMin param is zero
  if (isZeroBigNumberParam(value)) {
    value = getFallbackOutputValue(allCommands) || '0'
  }

  return { address, value }
}

// Helper Function to Extract Addresses from V2 and V3 Swap Commands
function getTokenAddressesFromV2V3SwapCommands(command: UniversalRouterCommand): {
  inputAddress?: string
  outputAddress?: string
} {
  let inputAddress: string | undefined
  let outputAddress: string | undefined

  const pathParam = command.params.find(({ name }) => name === 'path')
  if (!pathParam) {
    return { inputAddress, outputAddress }
  }

  if (command.commandName.startsWith('V2_SWAP_EXACT')) {
    const path = pathParam.value as string[]
    if (path.length > 0) {
      inputAddress = path[0]
      outputAddress = path[path.length - 1]
    }
  } else if (command.commandName.startsWith('V3_SWAP_EXACT')) {
    const path = pathParam.value as { fee: number; tokenIn: string; tokenOut: string }[]
    if (path.length > 0) {
      const first = path[0]
      if (first) {
        inputAddress = first.tokenIn
      }
      const last = path[path.length - 1]
      if (last) {
        outputAddress = last.tokenOut
      }
    }
  }

  return { inputAddress, outputAddress }
}

function getTokenDetailsFromV4SwapCommands(command: UniversalRouterCommand): {
  inputAddress?: string
  outputAddress?: string
  inputValue?: string
  outputValue?: string
} {
  let inputAddress: string | undefined
  let outputAddress: string | undefined
  let inputValue: string | undefined
  let outputValue: string | undefined

  if (command.commandName !== 'V4_SWAP') {
    return { inputAddress, outputAddress, inputValue, outputValue }
  }

  for (const param of command.params) {
    switch (param.name) {
      case 'SWAP_EXACT_IN':
        {
          const parsed = V4SwapExactInParamSchema.safeParse(param)
          if (!parsed.success) {
            break
          }

          for (const p of parsed.data.value) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (p.name === 'swap') {
              const swap = p.value

              inputAddress = swap.currencyIn
              inputValue = swap.amountIn
              outputValue = swap.amountOutMinimum

              const lastPath = swap.path[swap.path.length - 1]
              if (lastPath) {
                outputAddress = lastPath.intermediateCurrency
              }
            }
          }
        }
        break

      case 'SWAP_EXACT_OUT':
        {
          const parsed = V4SwapExactOutParamSchema.safeParse(param)
          if (!parsed.success) {
            break
          }

          for (const p of parsed.data.value) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (p.name === 'swap') {
              const swap = p.value

              outputAddress = swap.currencyOut
              outputValue = swap.amountOut
              inputValue = swap.amountInMaximum

              const firstPath = swap.path[0]
              if (firstPath) {
                inputAddress = firstPath.intermediateCurrency
              }
            }
          }
        }
        break

      case 'SWAP_EXACT_IN_SINGLE':
        {
          const parsed = V4SwapExactInSingleParamSchema.safeParse(param)
          if (!parsed.success) {
            break
          }

          for (const p of parsed.data.value) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (p.name === 'swap') {
              const swap = p.value

              inputValue = swap.amountIn
              outputValue = swap.amountOutMinimum

              if (swap.zeroForOne) {
                inputAddress = swap.poolKey.currency0
                outputAddress = swap.poolKey.currency1
              } else {
                inputAddress = swap.poolKey.currency1
                outputAddress = swap.poolKey.currency0
              }
            }
          }
        }
        break

      case 'SWAP_EXACT_OUT_SINGLE':
        {
          const parsed = V4SwapExactOutSingleParamSchema.safeParse(param)
          if (!parsed.success) {
            break
          }

          for (const p of parsed.data.value) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (p.name === 'swap') {
              const swap = p.value

              outputValue = swap.amountOut
              inputValue = swap.amountInMaximum

              if (swap.zeroForOne) {
                inputAddress = swap.poolKey.currency0
                outputAddress = swap.poolKey.currency1
              } else {
                inputAddress = swap.poolKey.currency1
                outputAddress = swap.poolKey.currency0
              }
            }
          }
        }
        break

      default:
        break
    }
  }

  return { inputAddress, outputAddress, inputValue, outputValue }
}

// Helper function to get fallback output value from sweep or unwrapWeth commands
function getFallbackOutputValue(allCommands?: UniversalRouterCommand[]): string {
  if (!allCommands) {
    return '0'
  }

  const sweepCommand = allCommands.find(isUrCommandSweep)
  const unwrapWethCommand = allCommands.find(isUrCommandUnwrapWeth)

  const sweepAmountOutParam = sweepCommand?.params.find(isAmountMinParam)
  const unwrapWethAmountOutParam = unwrapWethCommand?.params.find(isAmountMinParam)

  return sweepAmountOutParam?.value || unwrapWethAmountOutParam?.value || '0'
}

// Helper function to get fallback input value from SETTLE parameter
function getFallbackInputValue(command: UniversalRouterCommand): string {
  const potentialSettleParam = command.params.find(isSettleParam)
  const settleParam = potentialSettleParam && isSettleParam(potentialSettleParam) ? potentialSettleParam : undefined
  const settleAmountValue = settleParam?.value.find((item) => item.name === 'amount')
  return settleAmountValue?.value || '0'
}

export function isNonZeroBigNumber(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  try {
    const valueBN = BigNumber.from(value)
    return !valueBN.isZero()
  } catch {
    return false
  }
}

interface BigNumberParam {
  type: string
  hex: string
}

const isBigNumberParam = (obj: unknown): obj is BigNumberParam =>
  typeof obj === 'object' && !!obj && 'hex' in obj && typeof (obj as BigNumberParam).hex === 'string'

// We have to type this as unknown because BigNumberSchema is any (as defined in apps/extension/src/app/features/dappRequests/types/EthersTypes.ts)
function isZeroBigNumberParam(bigNumberObj: unknown): boolean {
  // We treat an undefined or badly formatted param as zero
  if (!bigNumberObj || !isBigNumberParam(bigNumberObj)) {
    return true
  }

  return !isNonZeroBigNumber(bigNumberObj.hex)
}
