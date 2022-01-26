/// <reference types="react" />
import { Currency, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
interface SwapRouteProps extends React.HTMLAttributes<HTMLDivElement> {
    trade: InterfaceTrade<Currency, Currency, TradeType>;
    syncing: boolean;
    fixedOpen?: boolean;
}
declare const _default: import("react").NamedExoticComponent<SwapRouteProps>;
export default _default;
