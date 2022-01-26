import { Currency, Percent, TradeType } from '@uniswap/sdk-core';
import { InterfaceTrade } from 'state/routing/types';
/**
 * Returns slippage tolerance based on values from current trade, gas estimates from api, and active network.
 */
export default function useAutoSlippageTolerance(trade: InterfaceTrade<Currency, Currency, TradeType> | undefined): Percent;
