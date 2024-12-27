import { ChainId, Currency, Price, Token } from '@uniswap/sdk-core';
import { Pool } from './pool';
/**
 * Represents a list of pools through which a swap can occur
 */
export declare class Route<TInput extends Currency, TOutput extends Currency> {
    readonly pools: Pool[];
    readonly tokenPath: Token[];
    readonly input: TInput;
    readonly output: TOutput;
    private _midPrice;
    constructor(pools: Pool[], input: TInput, output: TOutput);
    get chainId(): ChainId | number;
    /**
     * Returns the token representation of the input currency. If the input currency is Ether, returns the wrapped ether token.
     */
    get inputToken(): Token;
    /**
     * Returns the token representation of the output currency. If the output currency is Ether, returns the wrapped ether token.
     */
    get outputToken(): Token;
    /**
     * Returns the mid price of the route
     */
    get midPrice(): Price<TInput, TOutput>;
}
