import { Interface } from '@ethersproject/abi';
import { BigintIsh, Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { Trade } from './entities/trade';
import { PermitOptions, SelfPermit } from './selfPermit';
import { MethodParameters } from './utils/calldata';
export interface FeeOptions {
    /**
     * The percent of the output that will be taken as a fee.
     */
    fee: Percent;
    /**
     * The recipient of the fee.
     */
    recipient: string;
}
/**
 * Options for producing the arguments to send calls to the router.
 */
export interface SwapOptions {
    /**
     * How much the execution price is allowed to move unfavorably from the trade execution price.
     */
    slippageTolerance: Percent;
    /**
     * The account that should receive the output.
     */
    recipient: string;
    /**
     * When the transaction expires, in epoch seconds.
     */
    deadline: BigintIsh;
    /**
     * The optional permit parameters for spending the input.
     */
    inputTokenPermit?: PermitOptions;
    /**
     * The optional price limit for the trade.
     */
    sqrtPriceLimitX96?: BigintIsh;
    /**
     * Optional information for taking a fee on output.
     */
    fee?: FeeOptions;
}
/**
 * Represents the Uniswap V2 SwapRouter, and has static methods for helping execute trades.
 */
export declare abstract class SwapRouter extends SelfPermit {
    static INTERFACE: Interface;
    /**
     * Cannot be constructed.
     */
    private constructor();
    /**
     * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
     * @param trade to produce call parameters for
     * @param options options for the call parameters
     */
    static swapCallParameters(trade: Trade<Currency, Currency, TradeType>, options: SwapOptions): MethodParameters;
}
