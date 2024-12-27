import { ChainId } from '../constants';
import { Currency, CurrencyAmount, Token } from '../entities';
/**
 * Given a currency amount and a chain ID, returns the equivalent representation as a wrapped token amount.
 * In other words, if the currency is ETHER, returns the WETH9 token amount for the given chain. Otherwise, returns
 * the input currency amount.
 */
export declare function wrappedCurrencyAmount(currencyAmount: CurrencyAmount<Currency>, chainId: ChainId): CurrencyAmount<Token>;
