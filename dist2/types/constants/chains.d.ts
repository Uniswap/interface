/**
 * List of all the networks supported by the Uniswap Interface
 */
export declare enum SupportedChainId {
    MAINNET = 1,
    ROPSTEN = 3,
    RINKEBY = 4,
    GOERLI = 5,
    KOVAN = 42,
    ARBITRUM_ONE = 42161,
    ARBITRUM_RINKEBY = 421611,
    OPTIMISM = 10,
    OPTIMISTIC_KOVAN = 69,
    POLYGON = 137,
    POLYGON_MUMBAI = 80001
}
export declare const CHAIN_IDS_TO_NAMES: {
    1: string;
    3: string;
    4: string;
    5: string;
    42: string;
    137: string;
    80001: string;
    42161: string;
    421611: string;
    10: string;
    69: string;
};
/**
 * Array of all the supported chain IDs
 */
export declare const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[];
export declare const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS: SupportedChainId[];
/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export declare const L1_CHAIN_IDS: readonly [SupportedChainId.MAINNET, SupportedChainId.ROPSTEN, SupportedChainId.RINKEBY, SupportedChainId.GOERLI, SupportedChainId.KOVAN, SupportedChainId.POLYGON, SupportedChainId.POLYGON_MUMBAI];
export declare type SupportedL1ChainId = typeof L1_CHAIN_IDS[number];
/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export declare const L2_CHAIN_IDS: readonly [SupportedChainId.ARBITRUM_ONE, SupportedChainId.ARBITRUM_RINKEBY, SupportedChainId.OPTIMISM, SupportedChainId.OPTIMISTIC_KOVAN];
export declare type SupportedL2ChainId = typeof L2_CHAIN_IDS[number];
