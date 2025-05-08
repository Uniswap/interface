import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SwapDisplay } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapDisplay'
import { ETH_ADDRESS } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/constants'
import { formatUnits, useSwapDetails } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import { SwapSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { UniswapXSwapRequest } from 'src/app/features/dappRequests/types/Permit2Types'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { assert } from 'utilities/src/errors'

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
  const { defaultChainId } = useEnabledChains()
  const activeChain = useDappLastChainId(dappUrl) || defaultChainId

  const { inputIdentifier, outputIdentifier, inputValue, outputValue } = useSwapDetails(dappRequest, dappUrl)

  const inputCurrencyInfo = useCurrencyInfo(inputIdentifier)
  const outputCurrencyInfo = useCurrencyInfo(outputIdentifier)

  const isFirstCommandWrappingEth = dappRequest.parsedCalldata.commands[0]?.commandName === 'WRAP_ETH'
  const isLastCommandUnwrappingEth =
    dappRequest.parsedCalldata.commands[dappRequest.parsedCalldata.commands.length - 1]?.commandName === 'UNWRAP_WETH'

  const nativeCurrencyInfo = useNativeCurrencyInfo(activeChain)
  const nativeCurrency = nativeCurrencyInfo?.currency

  const nativeInput =
    isFirstCommandWrappingEth && nativeCurrency && inputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const nativeOutput =
    isLastCommandUnwrappingEth && nativeCurrency && outputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const currencyInfo0 = nativeInput ? nativeCurrencyInfo : inputCurrencyInfo
  const currencyInfo1 = nativeOutput ? nativeCurrencyInfo : outputCurrencyInfo

  const inputAmount = formatUnits(inputValue, inputCurrencyInfo?.currency.decimals || 18)
  const outputAmount = formatUnits(outputValue, outputCurrencyInfo?.currency.decimals || 18)

  // TODO (EXT-1083): add USDC values to SwapTransactionTypeInfo and display on notification toast
  // Need the raw uint256 amounts, not the exact floating point amounts
  const inputAmountRaw = formatUnits(inputValue, 0)
  const outputAmountRaw = formatUnits(outputValue, 0)
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
      isWrap={false}
      isUnwrap={false}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    />
  )
}

// this is a special cased version of SwapRequestContent used for UniswapX swaps
export function UniswapXSwapRequestContent({ typedData }: { typedData: UniswapXSwapRequest }): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const { chainId: domainChainId } = typedData.domain
  const activeChain = toSupportedChainId(domainChainId) || defaultChainId

  const { token: inputToken, amount: firstAmountInParam } = typedData.message.permitted
  const { token: outputToken, startAmount: lastAmountOutParam } = typedData.message.witness.baseOutputs[0]

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
      isWrap={false}
      isUnwrap={false}
    />
  )
}
