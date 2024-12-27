import { ChainId } from '../constants';
import { Currency, Token } from '../entities';
/**
 * Given a currency which can be Ether or a token, return wrapped ether for ether and the token for the token
 * @param currency the currency to wrap, if necessary
 * @param chainId the ID of the chain for wrapping
 */
export declare function wrappedCurrency(currency: Currency, chainId: ChainId): Token;
