import { ChainId } from 'src/constants/chains'
import { DAI, DAI_ARBITRUM_ONE } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokens/NativeCurrency'

/**
 * It is expected for the routing API to error often when fetching quotes for
 * high dollar values on long-tail tokens (due to low liquidity). This happens
 * often as we fetch USD quotes for these long tail tokens.
 *
 * To improve quality of logs, we ignore all USD quote errors, unless the input
 * currency is a widely used currency listed here.
 */
export const SAFE_TOKENS_TO_LOG = [
  NativeCurrency.onChain(ChainId.Mainnet),
  NativeCurrency.onChain(ChainId.ArbitrumOne),
  NativeCurrency.onChain(ChainId.Optimism),
  NativeCurrency.onChain(ChainId.Polygon),
  DAI,
  DAI_ARBITRUM_ONE,
]
