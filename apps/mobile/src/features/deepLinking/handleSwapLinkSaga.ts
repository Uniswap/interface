import { navigate } from 'src/app/navigation/rootNavigation'
import { createSwapTransactionState, ParseSwapLinkFunction } from 'src/features/deepLinking/parseSwapLink'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'

/**
 * Opens swap modal with the provided swap link parameters; prompts testnet switch modal if necessary.
 *
 * @param url - The URL to parse
 * @param parseSwapLink - The function to parse the swap link
 */
export function* handleSwapLink(url: URL, parseSwapLink: ParseSwapLinkFunction) {
  try {
    const params = parseSwapLink(url)

    logger.info('handleSwapLinkSaga', 'handleSwapLink', 'Navigating to swap modal with params', params)

    const { inputAsset, outputAsset } = params
    const swapFormState = createSwapTransactionState(params)

    // Check if testnet mode alignment is needed
    const isTestnetChains =
      (inputAsset?.chainId && isTestnetChain(inputAsset.chainId)) ||
      (outputAsset?.chainId && isTestnetChain(outputAsset.chainId))
    const { isTestnetModeEnabled } = yield* getEnabledChainIdsSaga(Platform.EVM)

    // prefill modal irrespective of testnet mode alignment
    navigate(ModalName.Swap, swapFormState)

    // if testnet mode isn't aligned with assets, prompt testnet switch modal (closes prefilled swap modal if rejected)
    if (isTestnetModeEnabled !== isTestnetChains) {
      navigate(ModalName.TestnetSwitchModal, { switchToMode: isTestnetChains ? 'testnet' : 'production' })
      return
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'handleSwapLinkSaga', function: 'handleSwapLink' } })
    navigate(ModalName.Swap)
  }
}
