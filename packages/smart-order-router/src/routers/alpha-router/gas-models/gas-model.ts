import { BigNumber } from '@ethersproject/bignumber';
import { Token } from '@uniswap/sdk-core';

import {
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI_ARBITRUM,
  DAI_ARBITRUM_RINKEBY,
  DAI_GÖRLI,
  DAI_KOVAN,
  DAI_MAINNET,
  DAI_OPTIMISM, DAI_OPTIMISTIC_GOERLI,
  DAI_OPTIMISTIC_KOVAN,
  DAI_POLYGON_MUMBAI,
  DAI_RINKEBY_1,
  DAI_RINKEBY_2,
  DAI_ROPSTEN,
  USDC_ARBITRUM,
  USDC_ETHEREUM_GNOSIS,
  USDC_GÖRLI,
  USDC_KOVAN,
  USDC_MAINNET,
  USDC_MOONBEAM,
  USDC_OPTIMISM, USDC_OPTIMISTIC_GOERLI,
  USDC_OPTIMISTIC_KOVAN,
  USDC_POLYGON,
  USDC_ROPSTEN,
  USDT_ARBITRUM,
  USDT_ARBITRUM_RINKEBY,
  USDT_GÖRLI,
  USDT_KOVAN,
  USDT_MAINNET,
  USDT_OPTIMISM, USDT_OPTIMISTIC_GOERLI,
  USDT_OPTIMISTIC_KOVAN,
  USDT_ROPSTEN,
  WBTC_GÖRLI,
} from '../../../providers/token-provider';
import { IV2PoolProvider } from '../../../providers/v2/pool-provider';
import {
  ArbitrumGasData,
  IL2GasDataProvider,
  OptimismGasData,
} from '../../../providers/v3/gas-data-provider';
import { IV3PoolProvider } from '../../../providers/v3/pool-provider';
import { CurrencyAmount } from '../../../util/amounts';
import { ChainId } from '../../../util/chains';
import {
  MixedRouteWithValidQuote,
  RouteWithValidQuote,
  V2RouteWithValidQuote,
  V3RouteWithValidQuote,
} from '../entities/route-with-valid-quote';


export const usdGasTokensByChain: { [chainId in ChainId]?: Token[] } = {
  [ChainId.MAINNET]: [DAI_MAINNET, USDC_MAINNET, USDT_MAINNET],
  [ChainId.RINKEBY]: [DAI_RINKEBY_1, DAI_RINKEBY_2],
  [ChainId.ARBITRUM_ONE]: [DAI_ARBITRUM, USDC_ARBITRUM, USDT_ARBITRUM],
  [ChainId.OPTIMISM]: [DAI_OPTIMISM, USDC_OPTIMISM, USDT_OPTIMISM],
  [ChainId.OPTIMISTIC_KOVAN]: [
    DAI_OPTIMISTIC_KOVAN,
    USDC_OPTIMISTIC_KOVAN,
    USDT_OPTIMISTIC_KOVAN,
  ],
  [ChainId.OPTIMISTIC_GOERLI]: [
    DAI_OPTIMISTIC_GOERLI,
    USDC_OPTIMISTIC_GOERLI,
    USDT_OPTIMISTIC_GOERLI,
  ],
  [ChainId.ARBITRUM_RINKEBY]: [DAI_ARBITRUM_RINKEBY, USDT_ARBITRUM_RINKEBY],
  [ChainId.KOVAN]: [DAI_KOVAN, USDC_KOVAN, USDT_KOVAN],
  [ChainId.GÖRLI]: [DAI_GÖRLI, USDC_GÖRLI, USDT_GÖRLI, WBTC_GÖRLI],
  [ChainId.ROPSTEN]: [DAI_ROPSTEN, USDC_ROPSTEN, USDT_ROPSTEN],
  [ChainId.POLYGON]: [USDC_POLYGON],
  [ChainId.POLYGON_MUMBAI]: [DAI_POLYGON_MUMBAI],
  [ChainId.CELO]: [CUSD_CELO],
  [ChainId.CELO_ALFAJORES]: [CUSD_CELO_ALFAJORES],
  [ChainId.GNOSIS]: [USDC_ETHEREUM_GNOSIS],
  [ChainId.MOONBEAM]: [USDC_MOONBEAM],
};

export type L1ToL2GasCosts = {
  gasUsedL1: BigNumber;
  gasCostL1USD: CurrencyAmount;
  gasCostL1QuoteToken: CurrencyAmount;
};

export type BuildOnChainGasModelFactoryType = {
  chainId: ChainId;
  gasPriceWei: BigNumber;
  v3poolProvider: IV3PoolProvider;
  token: Token;
  v2poolProvider: IV2PoolProvider;
  l2GasDataProvider?:
    | IL2GasDataProvider<OptimismGasData>
    | IL2GasDataProvider<ArbitrumGasData>;
};

export type BuildV2GasModelFactoryType = {
  chainId: ChainId;
  gasPriceWei: BigNumber;
  poolProvider: IV2PoolProvider;
  token: Token;
};

/**
 * Contains functions for generating gas estimates for given routes.
 *
 * We generally compute gas estimates off-chain because
 *  1/ Calling eth_estimateGas for a swaps requires the caller to have
 *     the full balance token being swapped, and approvals.
 *  2/ Tracking gas used using a wrapper contract is not accurate with Multicall
 *     due to EIP-2929
 *  3/ For V2 we simulate all our swaps off-chain so have no way to track gas used.
 *
 * Generally these models should be optimized to return quickly by performing any
 * long running operations (like fetching external data) outside of the functions defined.
 * This is because the functions in the model are called once for every route and every
 * amount that is considered in the algorithm so it is important to minimize the number of
 * long running operations.
 */
export type IGasModel<TRouteWithValidQuote extends RouteWithValidQuote> = {
  estimateGasCost(routeWithValidQuote: TRouteWithValidQuote): {
    gasEstimate: BigNumber;
    gasCostInToken: CurrencyAmount;
    gasCostInUSD: CurrencyAmount;
  };
  calculateL1GasFees?(routes: TRouteWithValidQuote[]): Promise<L1ToL2GasCosts>;
};

/**
 * Factory for building gas models that can be used with any route to generate
 * gas estimates.
 *
 * Factory model is used so that any supporting data can be fetched once and
 * returned as part of the model.
 *
 * @export
 * @abstract
 * @class IV2GasModelFactory
 */
export abstract class IV2GasModelFactory {
  public abstract buildGasModel({
    chainId,
    gasPriceWei,
    poolProvider,
    token,
  }: BuildV2GasModelFactoryType): Promise<IGasModel<V2RouteWithValidQuote>>;
}

/**
 * Factory for building gas models that can be used with any route to generate
 * gas estimates.
 *
 * Factory model is used so that any supporting data can be fetched once and
 * returned as part of the model.
 *
 * @export
 * @abstract
 * @class IOnChainGasModelFactory
 */
export abstract class IOnChainGasModelFactory {
  public abstract buildGasModel({
    chainId,
    gasPriceWei,
    v3poolProvider,
    token,
    v2poolProvider,
    l2GasDataProvider,
  }: BuildOnChainGasModelFactoryType): Promise<
    IGasModel<V3RouteWithValidQuote | MixedRouteWithValidQuote>
  >;
}
