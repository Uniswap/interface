"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeCurrencyName = exports.SUPPORTED_CHAINS = exports.secondsToBlocks = exports.getAverageBlockTimeSecs = exports.AVERAGE_BLOCK_TIMES_SECONDS = exports.ChainId = void 0;
// Supported chain IDs for Uniswap deployments
var ChainId;
(function (ChainId) {
    ChainId[ChainId["MAINNET"] = 1] = "MAINNET";
    ChainId[ChainId["GOERLI"] = 5] = "GOERLI";
    ChainId[ChainId["SEPOLIA"] = 11155111] = "SEPOLIA";
    ChainId[ChainId["OPTIMISM"] = 10] = "OPTIMISM";
    ChainId[ChainId["OPTIMISM_GOERLI"] = 420] = "OPTIMISM_GOERLI";
    ChainId[ChainId["OPTIMISM_SEPOLIA"] = 11155420] = "OPTIMISM_SEPOLIA";
    ChainId[ChainId["ARBITRUM_ONE"] = 42161] = "ARBITRUM_ONE";
    ChainId[ChainId["ARBITRUM_GOERLI"] = 421613] = "ARBITRUM_GOERLI";
    ChainId[ChainId["ARBITRUM_SEPOLIA"] = 421614] = "ARBITRUM_SEPOLIA";
    ChainId[ChainId["POLYGON"] = 137] = "POLYGON";
    ChainId[ChainId["POLYGON_MUMBAI"] = 80001] = "POLYGON_MUMBAI";
    ChainId[ChainId["CELO"] = 42220] = "CELO";
    ChainId[ChainId["CELO_ALFAJORES"] = 44787] = "CELO_ALFAJORES";
    ChainId[ChainId["GNOSIS"] = 100] = "GNOSIS";
    ChainId[ChainId["MOONBEAM"] = 1284] = "MOONBEAM";
    ChainId[ChainId["BNB"] = 56] = "BNB";
    ChainId[ChainId["AVALANCHE"] = 43114] = "AVALANCHE";
    ChainId[ChainId["BASE_GOERLI"] = 84531] = "BASE_GOERLI";
    ChainId[ChainId["BASE_SEPOLIA"] = 84532] = "BASE_SEPOLIA";
    ChainId[ChainId["BASE"] = 8453] = "BASE";
    ChainId[ChainId["ZORA"] = 7777777] = "ZORA";
    ChainId[ChainId["ZORA_SEPOLIA"] = 999999999] = "ZORA_SEPOLIA";
    ChainId[ChainId["ROOTSTOCK"] = 30] = "ROOTSTOCK";
    ChainId[ChainId["BLAST"] = 81457] = "BLAST";
    ChainId[ChainId["ZKSYNC"] = 324] = "ZKSYNC";
    ChainId[ChainId["WORLDCHAIN"] = 480] = "WORLDCHAIN";
    ChainId[ChainId["UNICHAIN_SEPOLIA"] = 1301] = "UNICHAIN_SEPOLIA";
    ChainId[ChainId["UNICHAIN"] = 130] = "UNICHAIN";
    ChainId[ChainId["MONAD_TESTNET"] = 10143] = "MONAD_TESTNET";
    ChainId[ChainId["SONEIUM"] = 1868] = "SONEIUM";
    ChainId[ChainId["MONAD"] = 143] = "MONAD";
    ChainId[ChainId["XLAYER"] = 196] = "XLAYER";
    ChainId[ChainId["LINEA"] = 59144] = "LINEA";
    ChainId[ChainId["TEMPO"] = 4217] = "TEMPO";
    ChainId[ChainId["MEGAETH"] = 4326] = "MEGAETH";
    ChainId[ChainId["ARC"] = 5042] = "ARC";
    ChainId[ChainId["ROBINHOOD"] = 4663] = "ROBINHOOD";
    ChainId[ChainId["INK"] = 57073] = "INK";
    ChainId[ChainId["HYPEREVM"] = 999] = "HYPEREVM";
})(ChainId = exports.ChainId || (exports.ChainId = {}));
/**
 * Average block time in seconds, per chain. Fractional values are intentional
 * for sub-second chains so block-from-timestamp math stays accurate. Used as a
 * single source of truth across UniswapX services and GPA to avoid drift.
 *
 * Values reflect each chain's most recent published target as of the last
 * update; update here when chains alter their block cadence.
 */
exports.AVERAGE_BLOCK_TIMES_SECONDS = {
    [ChainId.MAINNET]: 12,
    [ChainId.OPTIMISM]: 2,
    [ChainId.ARBITRUM_ONE]: 0.25,
    [ChainId.POLYGON]: 1.75,
    [ChainId.CELO]: 1,
    [ChainId.BNB]: 0.45,
    [ChainId.AVALANCHE]: 1,
    [ChainId.BASE]: 2,
    [ChainId.ZORA]: 2,
    [ChainId.BLAST]: 2,
    [ChainId.WORLDCHAIN]: 2,
    [ChainId.UNICHAIN]: 1,
    [ChainId.SONEIUM]: 2,
    [ChainId.MONAD]: 0.4,
    [ChainId.XLAYER]: 1,
    [ChainId.TEMPO]: 0.5,
    [ChainId.MEGAETH]: 1,
    [ChainId.ARC]: 0.48,
    [ChainId.ROBINHOOD]: 0.1,
    [ChainId.INK]: 1,
    [ChainId.HYPEREVM]: 1, // HyperEVM small-block cadence; verify against network target before relying on it
};
/**
 * Returns the average block time in seconds for a chain. Throws if the chain
 * is not registered — callers must extend AVERAGE_BLOCK_TIMES_SECONDS rather
 * than silently fall back to a mainnet-shaped default that would undercount
 * blocks on faster chains.
 */
function getAverageBlockTimeSecs(chainId) {
    const value = exports.AVERAGE_BLOCK_TIMES_SECONDS[chainId];
    if (value === undefined) {
        throw new Error(`getAverageBlockTimeSecs: unsupported chainId ${chainId}; register it in chains.ts before use`);
    }
    return value;
}
exports.getAverageBlockTimeSecs = getAverageBlockTimeSecs;
/**
 * Converts a wallclock duration in seconds to a block count for the given
 * chain, rounding up so the resulting window fully covers the requested time.
 * Throws if the chain is not registered in AVERAGE_BLOCK_TIMES_SECONDS.
 */
function secondsToBlocks(seconds, chainId) {
    return Math.ceil(seconds / getAverageBlockTimeSecs(chainId));
}
exports.secondsToBlocks = secondsToBlocks;
exports.SUPPORTED_CHAINS = [
    ChainId.MAINNET,
    ChainId.OPTIMISM,
    ChainId.OPTIMISM_GOERLI,
    ChainId.OPTIMISM_SEPOLIA,
    ChainId.ARBITRUM_ONE,
    ChainId.ARBITRUM_GOERLI,
    ChainId.ARBITRUM_SEPOLIA,
    ChainId.POLYGON,
    ChainId.POLYGON_MUMBAI,
    ChainId.GOERLI,
    ChainId.SEPOLIA,
    ChainId.CELO_ALFAJORES,
    ChainId.CELO,
    ChainId.BNB,
    ChainId.AVALANCHE,
    ChainId.BASE,
    ChainId.BASE_GOERLI,
    ChainId.BASE_SEPOLIA,
    ChainId.ZORA,
    ChainId.ZORA_SEPOLIA,
    ChainId.ROOTSTOCK,
    ChainId.BLAST,
    ChainId.ZKSYNC,
    ChainId.WORLDCHAIN,
    ChainId.UNICHAIN_SEPOLIA,
    ChainId.UNICHAIN,
    ChainId.MONAD_TESTNET,
    ChainId.SONEIUM,
    ChainId.MONAD,
    ChainId.XLAYER,
    ChainId.LINEA,
    ChainId.TEMPO,
    ChainId.MEGAETH,
    ChainId.ARC,
    ChainId.ROBINHOOD,
    ChainId.INK,
    ChainId.HYPEREVM,
];
var NativeCurrencyName;
(function (NativeCurrencyName) {
    // Strings match input for CLI
    NativeCurrencyName["ETHER"] = "ETH";
    NativeCurrencyName["MATIC"] = "MATIC";
    NativeCurrencyName["CELO"] = "CELO";
    NativeCurrencyName["GNOSIS"] = "XDAI";
    NativeCurrencyName["MOONBEAM"] = "GLMR";
    NativeCurrencyName["BNB"] = "BNB";
    NativeCurrencyName["AVAX"] = "AVAX";
    NativeCurrencyName["ROOTSTOCK"] = "RBTC";
    NativeCurrencyName["HYPE"] = "HYPE";
})(NativeCurrencyName = exports.NativeCurrencyName || (exports.NativeCurrencyName = {}));
//# sourceMappingURL=chains.js.map