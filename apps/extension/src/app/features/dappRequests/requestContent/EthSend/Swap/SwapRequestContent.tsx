/* eslint-disable complexity */
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { formatUnits } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import { SwapSendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
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
import { Flex, Separator, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { assert } from 'utilities/src/errors'
import { NumberType } from 'utilities/src/format/types'
import { SplitLogo } from 'wallet/src/components/CurrencyLogo/SplitLogo'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { TransactionType, TransactionTypeInfo } from 'wallet/src/features/transactions/types'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

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
  const { t } = useTranslation()
  const { dappUrl } = useDappRequestQueueContext()
  const { formatCurrencyAmount } = useLocalizationContext()
  const activeChain = useDappLastChainId(dappUrl)

  const { inputIdentifier, outputIdentifier } = useSwapCurrencyIdentifiers(dappRequest, dappUrl)

  const inputCurrencyInfo = useCurrencyInfo(inputIdentifier)
  const outputCurrencyInfo = useCurrencyInfo(outputIdentifier)

  const isFirstCommandWrappingEth = dappRequest.parsedCalldata.commands[0]?.commandName === 'WrapEth'
  const isLastCommandUnwrappingEth =
    dappRequest.parsedCalldata.commands[dappRequest.parsedCalldata.commands.length - 1]?.commandName === 'UnwrapWeth'

  const nativeCurrency = NativeCurrency.onChain(activeChain || UniverseChainId.Mainnet)

  const nativeInput = isFirstCommandWrappingEth && inputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const nativeOutput = isLastCommandUnwrappingEth && outputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const currency0 = nativeInput ? nativeCurrency : inputCurrencyInfo?.currency
  const currency1 = nativeOutput ? nativeCurrency : outputCurrencyInfo?.currency

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

  const inputCurrencyAmount = getCurrencyAmount({
    value: inputAmount,
    valueType: ValueType.Exact,
    currency: inputCurrencyInfo?.currency,
  })
  const inputValue = useUSDCValue(inputCurrencyAmount)

  const outputCurrencyAmount = getCurrencyAmount({
    value: outputAmount,
    valueType: ValueType.Exact,
    currency: outputCurrencyInfo?.currency,
  })
  const outputValue = useUSDCValue(outputCurrencyAmount)

  const showSwapDetails = Boolean(currency0?.symbol && currency1?.symbol)
  const showSplitLogo = Boolean(inputCurrencyInfo?.logoUrl && outputCurrencyInfo?.logoUrl)

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
    inputCurrencyInfo,
    outputCurrencyInfo,
    inputAmountRaw,
    outputAmountRaw,
  })
  const onConfirmWithTransactionTypeInfo = (): Promise<void> => onConfirm(transactionTypeInfo)

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('swap.button.swap')}
      headerIcon={
        showSplitLogo ? (
          <SplitLogo
            chainId={activeChain || UniverseChainId.Mainnet}
            inputCurrencyInfo={inputCurrencyInfo}
            outputCurrencyInfo={outputCurrencyInfo}
            size={iconSizes.icon40}
          />
        ) : undefined
      }
      title={
        currency0?.symbol && currency1?.symbol
          ? t('swap.request.title.full', {
              inputCurrencySymbol: currency0?.symbol,
              outputCurrencySymbol: currency1?.symbol,
            })
          : t('swap.request.title.short')
      }
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirmWithTransactionTypeInfo}
    >
      {showSwapDetails && (
        <>
          <Separator />
          <Flex
            alignItems="flex-start"
            flexDirection="column"
            flexGrow={1}
            gap="$spacing12"
            justifyContent="flex-start"
            px="$spacing8"
            py="$spacing16"
          >
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: inputCurrencyAmount, type: NumberType.TokenTx })} {currency0?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: inputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={inputCurrencyInfo} />
            </Flex>
            <ArrowDown color="$neutral3" size="$icon.24" />
            <Flex flexDirection="row" justifyContent="space-between" width="100%">
              <Flex flexDirection="column">
                <Text color="$neutral1" variant="heading3">
                  {formatCurrencyAmount({ value: outputCurrencyAmount, type: NumberType.TokenTx })} {currency1?.symbol}
                </Text>
                <Text color="$neutral2" variant="body3">
                  {formatCurrencyAmount({ value: outputValue, type: NumberType.FiatTokenPrice })}
                </Text>
              </Flex>
              <CurrencyLogo currencyInfo={outputCurrencyInfo} />
            </Flex>
          </Flex>
        </>
      )}
    </DappRequestContent>
  )
}
