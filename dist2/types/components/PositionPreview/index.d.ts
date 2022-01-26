import { Currency } from '@uniswap/sdk-core';
import { Position } from '@uniswap/v3-sdk';
import { ReactNode } from 'react';
export declare const PositionPreview: ({ position, title, inRange, baseCurrencyDefault, ticksAtLimit, }: {
    position: Position;
    title?: ReactNode;
    inRange: boolean;
    baseCurrencyDefault?: Currency | undefined;
    ticksAtLimit: {
        [bound: string]: boolean | undefined;
    };
}) => JSX.Element;
