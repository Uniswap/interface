/// <reference types="react" />
import { Protocol } from '@uniswap/router-sdk';
import { Currency, Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
export interface RoutingDiagramEntry {
    percent: Percent;
    path: [Currency, Currency, FeeAmount][];
    protocol: Protocol;
}
export default function RoutingDiagram({ currencyIn, currencyOut, routes, }: {
    currencyIn: Currency;
    currencyOut: Currency;
    routes: RoutingDiagramEntry[];
}): JSX.Element;
