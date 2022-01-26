import { Currency } from '@uniswap/sdk-core';
import React from 'react';
export default function CurrencyLogo({ currency, size, style, ...rest }: {
    currency?: Currency | null;
    size?: string;
    style?: React.CSSProperties;
}): JSX.Element;
