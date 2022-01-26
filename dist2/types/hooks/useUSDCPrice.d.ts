import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core';
export declare const STABLECOIN_AMOUNT_OUT: {
    [chainId: number]: CurrencyAmount<Token>;
};
/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price<Currency, Token> | undefined;
export declare function useUSDCValue(currencyAmount: CurrencyAmount<Currency> | undefined | null): CurrencyAmount<Token> | null;
/**
 *
 * @param fiatValue string representation of a USD amount
 * @returns CurrencyAmount where currency is stablecoin on active chain
 */
export declare function useStablecoinAmountFromFiatValue(fiatValue: string | null | undefined): CurrencyAmount<Token> | undefined;
