import { BigintIsh, Percent, CurrencyAmount, Currency } from '@uniswap/sdk-core';
import { Position } from './entities/position';
import { MethodParameters } from './utils/calldata';
import { Interface } from '@ethersproject/abi';
import { PermitOptions, SelfPermit } from './selfPermit';
export interface MintSpecificOptions {
    /**
     * The account that should receive the minted NFT.
     */
    recipient: string;
    /**
     * Creates pool if not initialized before mint.
     */
    createPool?: boolean;
}
export interface IncreaseSpecificOptions {
    /**
     * Indicates the ID of the position to increase liquidity for.
     */
    tokenId: BigintIsh;
}
/**
 * Options for producing the calldata to add liquidity.
 */
export interface CommonAddLiquidityOptions {
    /**
     * How much the pool price is allowed to move.
     */
    slippageTolerance: Percent;
    /**
     * When the transaction expires, in epoch seconds.
     */
    deadline: BigintIsh;
    /**
     * Whether to spend ether. If true, one of the pool tokens must be WETH, by default false
     */
    useEther?: boolean;
    /**
     * The optional permit parameters for spending token0
     */
    token0Permit?: PermitOptions;
    /**
     * The optional permit parameters for spending token1
     */
    token1Permit?: PermitOptions;
}
export declare type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions;
export declare type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions;
export declare type AddLiquidityOptions = MintOptions | IncreaseOptions;
export interface CollectOptions {
    /**
     * Indicates the ID of the position to collect for.
     */
    tokenId: BigintIsh;
    /**
     * Expected value of tokensOwed0, including as-of-yet-unaccounted-for fees/liquidity value to be burned
     */
    expectedCurrencyOwed0: CurrencyAmount<Currency>;
    /**
     * Expected value of tokensOwed1, including as-of-yet-unaccounted-for fees/liquidity value to be burned
     */
    expectedCurrencyOwed1: CurrencyAmount<Currency>;
    /**
     * The account that should receive the tokens.
     */
    recipient: string;
}
export interface NFTPermitOptions {
    v: 0 | 1 | 27 | 28;
    r: string;
    s: string;
    deadline: BigintIsh;
    spender: string;
}
/**
 * Options for producing the calldata to exit a position.
 */
export interface RemoveLiquidityOptions {
    /**
     * The ID of the token to exit
     */
    tokenId: BigintIsh;
    /**
     * The percentage of position liquidity to exit.
     */
    liquidityPercentage: Percent;
    /**
     * How much the pool price is allowed to move.
     */
    slippageTolerance: Percent;
    /**
     * When the transaction expires, in epoch seconds.
     */
    deadline: BigintIsh;
    /**
     * Whether the NFT should be burned if the entire position is being exited, by default false.
     */
    burnToken?: boolean;
    /**
     * The optional permit of the token ID being exited, in case the exit transaction is being sent by an account that does not own the NFT
     */
    permit?: NFTPermitOptions;
    /**
     * Parameters to be passed on to collect
     */
    collectOptions: Omit<CollectOptions, 'tokenId'>;
}
export declare abstract class NonfungiblePositionManager extends SelfPermit {
    static INTERFACE: Interface;
    /**
     * Cannot be constructed.
     */
    private constructor();
    static addCallParameters(position: Position, options: AddLiquidityOptions): MethodParameters;
    private static encodeCollect;
    static collectCallParameters(options: CollectOptions): MethodParameters;
    /**
     * Produces the calldata for completely or partially exiting a position
     * @param position the position to exit
     * @param options additional information necessary for generating the calldata
     */
    static removeCallParameters(position: Position, options: RemoveLiquidityOptions): MethodParameters;
}
