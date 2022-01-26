import { Token } from '@uniswap/sdk-core';
import { TickData, TickProcessed } from 'hooks/usePoolTickData';
export default function computeSurroundingTicks(token0: Token, token1: Token, activeTickProcessed: TickProcessed, sortedTickData: TickData[], pivot: number, ascending: boolean): TickProcessed[];
