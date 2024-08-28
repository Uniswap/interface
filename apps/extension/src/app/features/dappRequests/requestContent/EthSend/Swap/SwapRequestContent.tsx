import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SwapDisplay } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapDisplay'
import { ETH_ADDRESS } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/constants'
import { formatUnits } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import { SignTypedDataRequest, SwapSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import {
  AmountInMaxParam,
  AmountInParam,
  AmountOutMinParam,
  AmountOutParam,
  Param,
  UniversalRouterCommand,
  isAmountInMaxParam,
  isAmountInParam,
  isAmountOutMinParam,
  isAmountOutParam,
  isURCommandASwap,
} from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/constants/chains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { assert } from 'utilities/src/errors'

function extractPathValues(commands: UniversalRouterCommand[]): {
  inputAddress: string | undefined
  outputAddress: string | undefined
} {
  let inputAddress: string | undefined
  let outputAddress: string | undefined
  for (const command of commands) {
    const param: Param | undefined = command.params.find(({ name }) => name === 'path')
    if (!param) {
      continue
    }
    // matches V2SwapExact[In|Out]
    if (command.commandName.startsWith('V2SwapExact')) {
      const path = param.value as string[]
      const first = path[0]
      if (first && !inputAddress) {
        inputAddress = first
      }
      const last = path[path.length - 1]
      if (last) {
        outputAddress = last
      }
    }
    // matches V3SwapExact[In|Out]
    if (command.commandName.startsWith('V3SwapExact')) {
      const path = param.value as { fee: number; tokenIn: string; tokenOut: string }[]
      const first = path[0]
      if (first && !inputAddress) {
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

function useSwapCurrencyIdentifiers(
  request: SwapSendTransactionRequest,
  dappUrl: string,
): { inputIdentifier: string | undefined; outputIdentifier: string | undefined } {
  const activeChain = useDappLastChainId(dappUrl)
  return getSwapCurrencyIdentifiers(request, activeChain)
}

export function getSwapCurrencyIdentifiers(
  request: SwapSendTransactionRequest,
  activeChain: WalletChainId | undefined,
): { inputIdentifier: string | undefined; outputIdentifier: string | undefined } {
  const { inputAddress, outputAddress } = extractPathValues(request.parsedCalldata.commands)

  const inputIdentifier = activeChain && inputAddress ? buildCurrencyId(activeChain, inputAddress) : undefined
  const outputIdentifier = activeChain && outputAddress ? buildCurrencyId(activeChain, outputAddress) : undefined

  return { inputIdentifier, outputIdentifier }
}

function getTransactionTypeInfo({
  inputCurrencyInfo,
  outputCurrencyInfo,
  inputAmountRaw,
  outputAmountRaw,
}: {
  inputCurrencyInfo: Maybe<CurrencyInfo>
  outputCurrencyInfo: Maybe<CurrencyInfo>
  inputAmountRaw: string
  outputAmountRaw: string
}): TransactionTypeInfo | undefined {
  return inputCurrencyInfo?.currencyId && outputCurrencyInfo?.currencyId
    ? {
        type: TransactionType.Swap,
        tradeType: 0, // TradeType.EXACT_INPUT, but TradeType doesn't matter for the UI
        inputCurrencyId: inputCurrencyInfo?.currencyId,
        outputCurrencyId: outputCurrencyInfo?.currencyId,
        inputCurrencyAmountRaw: inputAmountRaw,
        expectedOutputCurrencyAmountRaw: outputAmountRaw,
        minimumOutputCurrencyAmountRaw: outputAmountRaw,
      }
    : undefined
}

interface SwapRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: SwapSendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}

export function SwapRequestContent({
  transactionGasFeeResult,
  dappRequest,
  onCancel,
  onConfirm,
}: SwapRequestContentProps): JSX.Element {
  const { dappUrl } = useDappRequestQueueContext()
  const activeChain = useDappLastChainId(dappUrl) || UniverseChainId.Mainnet

  const { inputIdentifier, outputIdentifier } = useSwapCurrencyIdentifiers(dappRequest, dappUrl)

  const inputCurrencyInfo = useCurrencyInfo(inputIdentifier)
  const outputCurrencyInfo = useCurrencyInfo(outputIdentifier)

  const isFirstCommandWrappingEth = dappRequest.parsedCalldata.commands[0]?.commandName === 'WrapEth'
  const isLastCommandUnwrappingEth =
    dappRequest.parsedCalldata.commands[dappRequest.parsedCalldata.commands.length - 1]?.commandName === 'UnwrapWeth'

  const nativeCurrencyInfo = useNativeCurrencyInfo(activeChain)
  const nativeCurrency = nativeCurrencyInfo?.currency

  const nativeInput =
    isFirstCommandWrappingEth && nativeCurrency && inputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const nativeOutput =
    isLastCommandUnwrappingEth && nativeCurrency && outputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const currencyInfo0 = nativeInput ? nativeCurrencyInfo : inputCurrencyInfo
  const currencyInfo1 = nativeOutput ? nativeCurrencyInfo : outputCurrencyInfo

  const firstSwapCommand = dappRequest.parsedCalldata.commands.find(isURCommandASwap)
  const lastSwapCommand = dappRequest.parsedCalldata.commands.findLast(isURCommandASwap)

  assert(
    firstSwapCommand && lastSwapCommand,
    'SwapRequestContent: All swaps must have a defined input and output Universal Router command.',
  )

  function isAmountInOrMaxParam(param: Param): param is AmountInParam | AmountInMaxParam {
    return isAmountInParam(param) || isAmountInMaxParam(param)
  }

  function isAmountOutMinOrOutParam(param: Param): param is AmountOutMinParam | AmountOutParam {
    return isAmountOutMinParam(param) || isAmountOutParam(param)
  }

  // Ideally we would render some UI that makes it clear when you can expect minAmountOut instead of rendering what might look like a bad deal
  const firstAmountInParam = firstSwapCommand?.params.find(isAmountInOrMaxParam)
  const lastAmountOutParam = lastSwapCommand?.params.find(isAmountOutMinOrOutParam)

  assert(
    firstAmountInParam && lastAmountOutParam,
    'SwapRequestContent: All swaps must have a defined input and output amount parameter.',
  )

  const inputAmount = formatUnits(
    firstAmountInParam?.value || '0', // should always be defined--`assert` above catches this case
    inputCurrencyInfo?.currency.decimals || 18,
  )
  const outputAmount = formatUnits(
    lastAmountOutParam?.value || '0', // should always be defined--`assert` above catches this case
    outputCurrencyInfo?.currency.decimals || 18,
  )

  // TODO (EXT-1083): add USDC values to SwapTransactionTypeInfo and display on notification toast
  // Need the raw uint256 amounts, not the exact floating point amounts
  const inputAmountRaw = formatUnits(
    firstAmountInParam?.value || '0', // should always be defined--`assert` above catches this case
    0,
  )
  const outputAmountRaw = formatUnits(
    lastAmountOutParam?.value || '0', // should always be defined--`assert` above catches this case
    0,
  )
  const transactionTypeInfo = getTransactionTypeInfo({
    inputCurrencyInfo: currencyInfo0,
    outputCurrencyInfo: currencyInfo1,
    inputAmountRaw,
    outputAmountRaw,
  })
  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)

  return (
    <SwapDisplay
      chainId={activeChain}
      inputAmount={inputAmount}
      inputCurrencyInfo={currencyInfo0}
      outputAmount={outputAmount}
      outputCurrencyInfo={currencyInfo1}
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    />
  )
}

// this is a special cased version of SwapRequestContent used for UniswapX swaps
export function UniswapXSwapRequestContent({ dappRequest }: { dappRequest: SignTypedDataRequest }): JSX.Element {
  const parsedTypedData = JSON.parse(dappRequest.typedData)
  const { chainId: domainChainId } = parsedTypedData?.domain || {}
  const activeChain = toSupportedChainId(domainChainId) || UniverseChainId.Mainnet

  const { token: inputToken, amount: firstAmountInParam } = parsedTypedData?.message?.permitted || {}
  const { token: outputToken, startAmount: lastAmountOutParam } =
    parsedTypedData?.message?.witness?.baseOutputs[0] || {}

  const inputCurrencyInfo = useCurrencyInfo(buildCurrencyId(activeChain, inputToken))
  const nativeEthOrOutputToken = outputToken === ETH_ADDRESS ? DEFAULT_NATIVE_ADDRESS : outputToken
  const outputCurrencyInfo = useCurrencyInfo(buildCurrencyId(activeChain, nativeEthOrOutputToken))

  assert(
    firstAmountInParam && lastAmountOutParam,
    'SwapRequestContent: All swaps must have a defined input and output amount parameter.',
  )

  const inputAmount = formatUnits(
    firstAmountInParam || '0', // should always be defined--`assert` above catches this case
    inputCurrencyInfo?.currency.decimals || 18,
  )
  const outputAmount = formatUnits(
    lastAmountOutParam || '0', // should always be defined--`assert` above catches this case
    outputCurrencyInfo?.currency.decimals || 18,
  )

  return (
    <SwapDisplay
      isUniswapX
      chainId={activeChain}
      inputAmount={inputAmount}
      inputCurrencyInfo={inputCurrencyInfo}
      outputAmount={outputAmount}
      outputCurrencyInfo={outputCurrencyInfo}
    />
  )
}
