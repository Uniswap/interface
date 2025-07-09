import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SwapDisplay } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapDisplay'
import { formatUnits } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import { WrapSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useNativeCurrencyInfo, useWrappedNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

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
        inputCurrencyId: inputCurrencyInfo.currencyId,
        outputCurrencyId: outputCurrencyInfo.currencyId,
        inputCurrencyAmountRaw: inputAmountRaw,
        expectedOutputCurrencyAmountRaw: outputAmountRaw,
        minimumOutputCurrencyAmountRaw: outputAmountRaw,
      }
    : undefined
}

interface WrapRequestContentProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: WrapSendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: (transactionTypeInfo?: TransactionTypeInfo) => Promise<void>
}

export function WrapRequestContent({
  transactionGasFeeResult,
  dappRequest,
  onCancel,
  onConfirm,
}: WrapRequestContentProps): JSX.Element {
  const { dappUrl } = useDappRequestQueueContext()
  const { defaultChainId } = useEnabledChains()
  const activeChain = useDappLastChainId(dappUrl) || defaultChainId
  const chainId = dappRequest.transaction.chainId || activeChain

  // Determine if this is a wrap (ETH -> WETH) or unwrap (WETH -> ETH) transaction
  const isUnwrap = dappRequest.functionSignature === 'withdraw(uint256)'

  // Get native currency and wrapped currency info
  const nativeCurrencyInfo = useNativeCurrencyInfo(chainId)
  const wrappedCurrencyInfo = useWrappedNativeCurrencyInfo(chainId)

  // For a wrap, native is input and wrapped is output
  // For an unwrap, wrapped is input and native is output
  const inputCurrencyInfo = isUnwrap ? wrappedCurrencyInfo : nativeCurrencyInfo
  const outputCurrencyInfo = isUnwrap ? nativeCurrencyInfo : wrappedCurrencyInfo

  // Extract the amount from the transaction
  // For wrap: amount is in the value field
  // For unwrap: amount is in the data field (following the function selector)
  let amountValue = '0'
  if (isUnwrap && dappRequest.transaction.data) {
    // Parse the amount from the data field (remove the function selector - first 10 characters including 0x)
    const data = dappRequest.transaction.data.toString()
    if (data.length > 10) {
      amountValue = parseInt(data.slice(10, 74), 16).toString() // for withdraw(uint256), calldata is 36 bytes (4-byte selector + 32-byte argument). 1 byte = 2 hex characters, and data includes the 0x prefix, so select 64 characters starting from 10th character
    }
  } else {
    // For wrap, amount is in the value field
    amountValue = dappRequest.transaction.value?.toString() || '0'
  }

  const inputAmount = formatUnits(amountValue, inputCurrencyInfo?.currency.decimals || 18)
  const outputAmount = inputAmount // 1:1 conversion between ETH and WETH

  // Convert hex string into a decimal string
  const amountRaw = formatUnits(amountValue, 0)
  const transactionTypeInfo = getTransactionTypeInfo({
    inputCurrencyInfo,
    outputCurrencyInfo,
    inputAmountRaw: amountRaw,
    outputAmountRaw: amountRaw,
  })

  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)

  return (
    <SwapDisplay
      chainId={chainId}
      inputAmount={inputAmount}
      inputCurrencyInfo={inputCurrencyInfo}
      outputAmount={outputAmount}
      outputCurrencyInfo={outputCurrencyInfo}
      transactionGasFeeResult={transactionGasFeeResult}
      isWrap={!isUnwrap}
      isUnwrap={isUnwrap}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    />
  )
}
