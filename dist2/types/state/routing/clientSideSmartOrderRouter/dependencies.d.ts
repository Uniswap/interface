import { AlphaRouterParams } from '@uniswap/smart-order-router';
import { SupportedChainId } from 'constants/chains';
export declare type Dependencies = {
    [chainId in SupportedChainId]?: AlphaRouterParams;
};
/** Minimal set of dependencies for the router to work locally. */
export declare function buildDependencies(): Dependencies;
