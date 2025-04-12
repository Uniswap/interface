/* eslint-disable max-depth */
/* eslint-disable complexity */
import { BigNumber, BigNumberish } from 'ethers'
import { formatUnits as formatUnitsEthers } from 'ethers/lib/utils'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import {
  CONTRACT_BALANCE,
  ETH_ADDRESS,
  MAX_UINT160,
  MAX_UINT256,
} from 'src/app/features/dappRequests/requestContent/EthSend/Swap/constants'
import { SwapSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import {
  AmountInMaxParam,
  AmountInParam,
  AmountOutMinParam,
  AmountOutParam,
  Param,
  UniversalRouterCommand,
  V4SwapExactInParamSchema,
  V4SwapExactInSingleParamSchema,
  V4SwapExactOutParamSchema,
  V4SwapExactOutSingleParamSchema,
  isAmountInMaxParam,
  isAmountInParam,
  isAmountMinParam,
  isAmountOutMinParam,
  isAmountOutParam,
  isURCommandASwap,
  isUrCommandSweep,
  isUrCommandUnwrapWeth,
} from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/chainInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { assert } from 'utilities/src/errors'

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
  request: SwapSendTransactionRequest,
  dappUrl: string,
): {
  inputIdentifier: string | undefined
  outputIdentifier: string | undefined
  inputValue: string
  outputValue: string
} {
  const activeChain = useDappLastChainId(dappUrl)
  let inputAddress: string | undefined
  let outputAddress: string | undefined
  let inputValue: string = '0'
  let outputValue: string = '0'

  // Attempt to find a V4_SWAP command
  const v4Command = request.parsedCalldata.commands.find((command) => command.commandName.startsWith('V4_SWAP'))

  if (v4Command) {
    // Extract details using the V4 helper
    const v4Details = getTokenDetailsFromV4SwapCommands(v4Command)
    inputAddress = v4Details.inputAddress === ETH_ADDRESS ? DEFAULT_NATIVE_ADDRESS : v4Details.inputAddress
    outputAddress = v4Details.outputAddress === ETH_ADDRESS ? DEFAULT_NATIVE_ADDRESS : v4Details.outputAddress
    inputValue = v4Details.inputValue || '0'
    outputValue = v4Details.outputValue || '0'
  } else {
    // Fallback to V2/V3 extraction
    const addresses = extractTokenAddresses(request.parsedCalldata.commands)
    const amounts = getTokenAmounts(request.parsedCalldata.commands)

    inputAddress = addresses.inputAddress
    outputAddress = addresses.outputAddress
    inputValue = amounts.inputValue
    outputValue = amounts.outputValue
  }

  const inputIdentifier = activeChain && inputAddress ? buildCurrencyId(activeChain, inputAddress) : undefined

  const outputIdentifier = activeChain && outputAddress ? buildCurrencyId(activeChain, outputAddress) : undefined

  return { inputIdentifier, outputIdentifier, inputValue, outputValue }
}

// Existing Helper Function to Extract Token Addresses (for V2/V3)
function extractTokenAddresses(commands: UniversalRouterCommand[]): {
  inputAddress: string | undefined
  outputAddress: string | undefined
} {
  let inputAddress: string | undefined
  let outputAddress: string | undefined

  for (const command of commands) {
    const result = getTokenAddressesFromV2V3SwapCommands(command)
    if (result.inputAddress) {
      inputAddress = result.inputAddress
    }
    if (result.outputAddress) {
      outputAddress = result.outputAddress
    }
  }

  return { inputAddress, outputAddress }
}

function getTokenAmounts(commands: UniversalRouterCommand[]): {
  inputValue: string
  outputValue: string
} {
  const firstSwapCommand = commands.find(isURCommandASwap)
  const lastSwapCommand = commands.findLast(isURCommandASwap)
  const sweepCommand = commands.find(isUrCommandSweep)
  const unwrapWethCommand = commands.find(isUrCommandUnwrapWeth)

  assert(
    firstSwapCommand && lastSwapCommand,
    'SwapRequestContent: All swaps must have a defined input and output Universal Router command.',
  )

  const firstAmountInParam = firstSwapCommand?.params.find(isAmountInOrMaxParam)
  const lastAmountOutParam = lastSwapCommand?.params.find(isAmountOutMinOrOutParam)
  const sweepAmountOutParam = sweepCommand?.params.find(isAmountMinParam)
  const unwrapWethAmountOutParam = unwrapWethCommand?.params.find(isAmountMinParam)

  assert(
    firstAmountInParam && lastAmountOutParam,
    'SwapRequestContent: All swaps must have a defined input and output amount parameter.',
  )

  // There's a special case where V3_SWAP command's amountOutMin param is zero (0x00... some gas optimization slippage thing)
  // In this case fallback to the amountMin from the SWEEP or UNWRAP_WETH command as the outputValue
  const inputValue = firstAmountInParam?.value
  const fallbackOutputValue = sweepAmountOutParam?.value || unwrapWethAmountOutParam?.value
  const outputValue =
    fallbackOutputValue && isZeroBigNumberParam(lastAmountOutParam?.value)
      ? fallbackOutputValue
      : lastAmountOutParam?.value

  return {
    inputValue: inputValue || '0', // Safe due to assert
    outputValue: outputValue || '0', // Safe due to assert
  }
}

// Predicate Functions
function isAmountInOrMaxParam(param: Param): param is AmountInParam | AmountInMaxParam {
  return isAmountInParam(param) || isAmountInMaxParam(param)
}

function isAmountOutMinOrOutParam(param: Param): param is AmountOutMinParam | AmountOutParam {
  return isAmountOutMinParam(param) || isAmountOutParam(param)
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

  // Future handling for V4_SWAP can be added here

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
