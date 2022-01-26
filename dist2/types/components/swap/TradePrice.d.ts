/// <reference types="react" />
import { Currency, Price } from '@uniswap/sdk-core';
interface TradePriceProps {
    price: Price<Currency, Currency>;
    showInverted: boolean;
    setShowInverted: (showInverted: boolean) => void;
}
export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps): JSX.Element;
export {};
