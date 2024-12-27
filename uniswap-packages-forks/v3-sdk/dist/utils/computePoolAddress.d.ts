import { Token } from '@uniswap/sdk-core';
import { FeeAmount } from '../constants';
export declare function computePoolAddress({ factoryAddress, tokenA, tokenB, fee }: {
    factoryAddress: string;
    tokenA: Token;
    tokenB: Token;
    fee: FeeAmount;
}): string;
