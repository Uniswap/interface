import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core';
import { Position } from '@uniswap/v3-sdk';
import { ReactNode } from 'react';
import { PositionDetails } from 'types/position';
import { AppState } from '../../index';
export declare function useBurnV3State(): AppState['burnV3'];
export declare function useDerivedV3BurnInfo(position?: PositionDetails, asWETH?: boolean): {
    position?: Position;
    liquidityPercentage?: Percent;
    liquidityValue0?: CurrencyAmount<Currency>;
    liquidityValue1?: CurrencyAmount<Currency>;
    feeValue0?: CurrencyAmount<Currency>;
    feeValue1?: CurrencyAmount<Currency>;
    outOfRange: boolean;
    error?: ReactNode;
};
export declare function useBurnV3ActionHandlers(): {
    onPercentSelect: (percent: number) => void;
};
