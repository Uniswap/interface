export * from "@uniswap/sdk"

declare module '@uniswap/sdk' {
    export enum ChainId {
        LOCAL = 5777,
        RSK_MAINNET = 30,
        RSK_TESTNET = 31
    }
};
