import { BigNumber } from '@ethersproject/bignumber';
import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
import { Pool } from '@uniswap/v3-sdk';
export declare function useV3PositionFees(pool?: Pool, tokenId?: BigNumber, asWETH?: boolean): [CurrencyAmount<Currency>, CurrencyAmount<Currency>] | [undefined, undefined];
