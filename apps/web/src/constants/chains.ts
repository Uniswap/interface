import {
  ChainId,
  SUPPORTED_CHAINS,
  SupportedChainsType,
  V2_ROUTER_ADDRESSES,
} from "@jaguarswap/sdk-core";

export const CHAIN_IDS_TO_NAMES = {
  [ChainId.X1_TESTNET]: "x1-testnet",
} as const;

// Include ChainIds in this array if they are not supported by the UX yet, but are already in the SDK.
const NOT_YET_UX_SUPPORTED_CHAIN_IDS: number[] = [];

// TODO: include BASE_GOERLI, OPTIMISM_SEPOLIA, or ARBITRUM_SEPOLIA when routing is implemented
export type SupportedInterfaceChain = Exclude<
  SupportedChainsType,
  | ChainId.MAINNET
  | ChainId.OPTIMISM
  | ChainId.OPTIMISM_GOERLI
  | ChainId.OPTIMISM_SEPOLIA
  | ChainId.ARBITRUM_ONE
  | ChainId.ARBITRUM_GOERLI
  | ChainId.ARBITRUM_SEPOLIA
  | ChainId.POLYGON
  | ChainId.POLYGON_MUMBAI
  | ChainId.GOERLI
  | ChainId.SEPOLIA
  | ChainId.CELO_ALFAJORES
  | ChainId.CELO
  | ChainId.BNB
  | ChainId.AVALANCHE
  | ChainId.BASE
  | ChainId.BASE_GOERLI
  | ChainId.ZORA
  | ChainId.ZORA_SEPOLIA
  | ChainId.ROOTSTOCK
  | ChainId.BLAST
>;

export function isSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>,
): chainId is SupportedInterfaceChain {
  if (featureFlags && chainId && chainId in featureFlags) {
    return featureFlags[chainId];
  }
  return (
    !!chainId &&
    SUPPORTED_CHAINS.indexOf(chainId) !== -1 &&
    NOT_YET_UX_SUPPORTED_CHAIN_IDS.indexOf(chainId) === -1
  );
}

export function asSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>,
): SupportedInterfaceChain | undefined {
  if (!chainId) return undefined;
  if (featureFlags && chainId in featureFlags && !featureFlags[chainId]) {
    return undefined;
  }
  return isSupportedChain(chainId) ? chainId : undefined;
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
  ChainId.X1_TESTNET,
] as const;

/**
 * @deprecated when v2 pools are enabled on chains supported through sdk-core
 */
export const SUPPORTED_V2POOL_CHAIN_IDS_DEPRECATED = [
  ChainId.MAINNET,
  ChainId.GOERLI,
] as const;
export const SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map(
  (chainId) => parseInt(chainId),
);

export const TESTNET_CHAIN_IDS = [] as const;

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [ChainId.X1_TESTNET] as const;

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number];

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [] as const;

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number];

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId): number {
  switch (chainId) {
    // case ChainId.X1:
    case ChainId.X1_TESTNET:
      return 0;
    default:
      return 1;
  }
}

export function isUniswapXSupportedChain() {
  return false;
}
