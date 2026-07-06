export declare enum ChainId {
    MAINNET = 1,
    GOERLI = 5,
    SEPOLIA = 11155111,
    OPTIMISM = 10,
    OPTIMISM_GOERLI = 420,
    OPTIMISM_SEPOLIA = 11155420,
    ARBITRUM_ONE = 42161,
    ARBITRUM_GOERLI = 421613,
    ARBITRUM_SEPOLIA = 421614,
    POLYGON = 137,
    POLYGON_MUMBAI = 80001,
    CELO = 42220,
    CELO_ALFAJORES = 44787,
    GNOSIS = 100,
    MOONBEAM = 1284,
    BNB = 56,
    AVALANCHE = 43114,
    BASE_GOERLI = 84531,
    BASE_SEPOLIA = 84532,
    BASE = 8453,
    ZORA = 7777777,
    ZORA_SEPOLIA = 999999999,
    ROOTSTOCK = 30,
    BLAST = 81457,
    ZKSYNC = 324,
    WORLDCHAIN = 480,
    UNICHAIN_SEPOLIA = 1301,
    UNICHAIN = 130,
    MONAD_TESTNET = 10143,
    SONEIUM = 1868,
    MONAD = 143,
    XLAYER = 196,
    LINEA = 59144,
    TEMPO = 4217,
    MEGAETH = 4326,
    ARC = 5042,
    ROBINHOOD = 4663,
    INK = 57073,
    HYPEREVM = 999
}
/**
 * Average block time in seconds, per chain. Fractional values are intentional
 * for sub-second chains so block-from-timestamp math stays accurate. Used as a
 * single source of truth across UniswapX services and GPA to avoid drift.
 *
 * Values reflect each chain's most recent published target as of the last
 * update; update here when chains alter their block cadence.
 */
export declare const AVERAGE_BLOCK_TIMES_SECONDS: {
    [chainId: number]: number;
};
/**
 * Returns the average block time in seconds for a chain. Throws if the chain
 * is not registered — callers must extend AVERAGE_BLOCK_TIMES_SECONDS rather
 * than silently fall back to a mainnet-shaped default that would undercount
 * blocks on faster chains.
 */
export declare function getAverageBlockTimeSecs(chainId: number): number;
/**
 * Converts a wallclock duration in seconds to a block count for the given
 * chain, rounding up so the resulting window fully covers the requested time.
 * Throws if the chain is not registered in AVERAGE_BLOCK_TIMES_SECONDS.
 */
export declare function secondsToBlocks(seconds: number, chainId: number): number;
export declare const SUPPORTED_CHAINS: readonly [ChainId.MAINNET, ChainId.OPTIMISM, ChainId.OPTIMISM_GOERLI, ChainId.OPTIMISM_SEPOLIA, ChainId.ARBITRUM_ONE, ChainId.ARBITRUM_GOERLI, ChainId.ARBITRUM_SEPOLIA, ChainId.POLYGON, ChainId.POLYGON_MUMBAI, ChainId.GOERLI, ChainId.SEPOLIA, ChainId.CELO_ALFAJORES, ChainId.CELO, ChainId.BNB, ChainId.AVALANCHE, ChainId.BASE, ChainId.BASE_GOERLI, ChainId.BASE_SEPOLIA, ChainId.ZORA, ChainId.ZORA_SEPOLIA, ChainId.ROOTSTOCK, ChainId.BLAST, ChainId.ZKSYNC, ChainId.WORLDCHAIN, ChainId.UNICHAIN_SEPOLIA, ChainId.UNICHAIN, ChainId.MONAD_TESTNET, ChainId.SONEIUM, ChainId.MONAD, ChainId.XLAYER, ChainId.LINEA, ChainId.TEMPO, ChainId.MEGAETH, ChainId.ARC, ChainId.ROBINHOOD, ChainId.INK, ChainId.HYPEREVM];
export type SupportedChainsType = (typeof SUPPORTED_CHAINS)[number];
export declare enum NativeCurrencyName {
    ETHER = "ETH",
    MATIC = "MATIC",
    CELO = "CELO",
    GNOSIS = "XDAI",
    MOONBEAM = "GLMR",
    BNB = "BNB",
    AVAX = "AVAX",
    ROOTSTOCK = "RBTC",
    HYPE = "HYPE"
}
