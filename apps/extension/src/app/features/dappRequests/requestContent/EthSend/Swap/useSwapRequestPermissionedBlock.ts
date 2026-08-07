import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import type { DappSwapPermissionedBlock } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock'
import { useDappSwapPermissionedBlock } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/useDappSwapPermissionedBlock'
import { useSwapDetails } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import type { UniversalRouterCall } from 'src/app/features/dappRequests/types/UniversalRouterTypes'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { UniswapXSwapRequest } from 'wallet/src/components/dappRequests/types/Permit2Types'

// Resolves the permissioned-token block for a classic Universal Router swap request from its
// parsed calldata. This is the single source of truth for the block decision so the primary
// dispatch gate (EthSendRequestContent) and the Blockaid-fallback SwapRequestContent agree.
export function useUniversalRouterSwapPermissionedBlock({
  parsedCalldata,
  walletAddress,
}: {
  parsedCalldata: UniversalRouterCall
  walletAddress: string | undefined
}): DappSwapPermissionedBlock {
  const { dappUrl } = useDappRequestQueueContext()
  const { defaultChainId } = useEnabledChains()
  const activeChain = useDappLastChainId(dappUrl) || defaultChainId

  const { inputIdentifier, outputIdentifier } = useSwapDetails(parsedCalldata, dappUrl)
  const inputCurrencyInfo = useCurrencyInfo(inputIdentifier)
  const outputCurrencyInfo = useCurrencyInfo(outputIdentifier)

  const isFirstCommandWrappingEth = parsedCalldata.commands[0]?.commandName === 'WRAP_ETH'
  const isLastCommandUnwrappingEth =
    parsedCalldata.commands[parsedCalldata.commands.length - 1]?.commandName === 'UNWRAP_WETH'

  const nativeCurrencyInfo = useNativeCurrencyInfo(activeChain)
  const nativeCurrency = nativeCurrencyInfo?.currency
  const nativeInput =
    isFirstCommandWrappingEth && nativeCurrency && inputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)
  const nativeOutput =
    isLastCommandUnwrappingEth && nativeCurrency && outputCurrencyInfo?.currency.equals(nativeCurrency.wrapped)

  return useDappSwapPermissionedBlock({
    inputCurrencyInfo: nativeInput ? nativeCurrencyInfo : inputCurrencyInfo,
    outputCurrencyInfo: nativeOutput ? nativeCurrencyInfo : outputCurrencyInfo,
    walletAddress,
  })
}

// Resolves the permissioned-token block for a UniswapX (Permit2 typed-data) swap. Returns
// not-blocked when `typedData` is undefined (the request isn't a UniswapX swap), so the
// SignTypedData dispatch gate can call this unconditionally on every typed-data request.
export function useUniswapXSwapPermissionedBlock({
  typedData,
  walletAddress,
}: {
  typedData: UniswapXSwapRequest | undefined
  walletAddress: string | undefined
}): DappSwapPermissionedBlock {
  const { defaultChainId } = useEnabledChains()
  const domainChainId = typedData?.domain.chainId
  const activeChain = (domainChainId !== undefined ? toSupportedChainId(domainChainId) : undefined) || defaultChainId

  const inputToken = typedData?.message.permitted.token
  const rawOutputToken = typedData?.message.witness.baseOutputs[0]?.token
  const outputToken = rawOutputToken === DEFAULT_NATIVE_ADDRESS ? DEFAULT_NATIVE_ADDRESS_LEGACY : rawOutputToken

  const inputCurrencyInfo = useCurrencyInfo(inputToken ? buildCurrencyId(activeChain, inputToken) : undefined)
  const outputCurrencyInfo = useCurrencyInfo(outputToken ? buildCurrencyId(activeChain, outputToken) : undefined)

  return useDappSwapPermissionedBlock({ inputCurrencyInfo, outputCurrencyInfo, walletAddress })
}
