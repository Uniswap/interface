import { Ether, NativeCurrency, Token } from '@uniswap/sdk-core';
export declare const AMPL: Token;
export declare const DAI: Token;
export declare const DAI_ARBITRUM_ONE: Token;
export declare const DAI_OPTIMISM: Token;
export declare const USDC: Token;
export declare const USDC_ARBITRUM: Token;
export declare const USDC_POLYGON: Token;
export declare const DAI_POLYGON: Token;
export declare const USDT_POLYGON: Token;
export declare const WBTC_POLYGON: Token;
export declare const USDC_OPTIMISM: Token;
export declare const USDT: Token;
export declare const USDT_ARBITRUM_ONE: Token;
export declare const USDT_OPTIMISM: Token;
export declare const WBTC: Token;
export declare const WBTC_ARBITRUM_ONE: Token;
export declare const WBTC_OPTIMISM: Token;
export declare const FEI: Token;
export declare const TRIBE: Token;
export declare const FRAX: Token;
export declare const FXS: Token;
export declare const renBTC: Token;
export declare const ETH2X_FLI: Token;
export declare const sETH2: Token;
export declare const rETH2: Token;
export declare const SWISE: Token;
export declare const WETH_POLYGON_MUMBAI: Token;
export declare const WETH_POLYGON: Token;
export declare const UNI: {
    [chainId: number]: Token;
};
export declare const WRAPPED_NATIVE_CURRENCY: {
    [chainId: number]: Token;
};
export declare class ExtendedEther extends Ether {
    get wrapped(): Token;
    private static _cachedExtendedEther;
    static onChain(chainId: number): ExtendedEther;
}
export declare function nativeOnChain(chainId: number): NativeCurrency;
