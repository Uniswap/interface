/* eslint-disable rulesdir/no-undefined-or */
import { ChainId, Currency, V2_ROUTER_ADDRESSES } from "@taraswap/sdk-core";
import ms from "ms";
import { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { UNIVERSE_CHAIN_INFO } from "uniswap/src/constants/chains";
import { Chain as BackendChainId } from "uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks";
import { FeatureFlags } from "uniswap/src/features/gating/flags";
import { useFeatureFlag } from "uniswap/src/features/gating/hooks";
import { NetworkLayer, UniverseChainId } from "uniswap/src/types/chains";

export const AVERAGE_L1_BLOCK_TIME = ms(`12s`);

export const SUPPORTED_INTERFACE_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  ChainId.BLAST,
  ChainId.ZORA,
  ChainId.ZKSYNC,
  ChainId.TARAXA_TESTNET,
  ChainId.TARAXA,
] as const;

export function isSupportedChainId(
  chainId?: number | ChainId | null
): chainId is SupportedInterfaceChainId {
  return (
    !!chainId &&
    (chainId == ChainId.TARAXA || chainId == ChainId.TARAXA_TESTNET)
  );
}

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
// This is the reason why useSupportedChainId and useIsSupportedChainId is a hook instead of a function.
function useFeatureFlaggedChainIds(): Partial<
  Record<SupportedInterfaceChainId, boolean>
> {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)

  const zoraEnabled = useFeatureFlag(FeatureFlags.Zora);
  const zkSyncEnabled = useFeatureFlag(FeatureFlags.ZkSync);
  return useMemo(
    () => ({
      [ChainId.ZORA]: zoraEnabled,
      [ChainId.ZKSYNC]: zkSyncEnabled,
    }),
    [zkSyncEnabled, zoraEnabled]
  );
}

export function useIsSupportedChainId(
  chainId?: number | ChainId
): chainId is SupportedInterfaceChainId {
  const featureFlaggedChains = useFeatureFlaggedChainIds();

  const chainIsNotEnabled =
    featureFlaggedChains[chainId as SupportedInterfaceChainId] === false;
  return chainIsNotEnabled ? false : isSupportedChainId(chainId);
}

export function useIsSupportedChainIdCallback() {
  const featureFlaggedChains = useFeatureFlaggedChainIds();

  return useCallback(
    (chainId?: number | ChainId): chainId is SupportedInterfaceChainId => {
      const chainIsNotEnabled =
        featureFlaggedChains[chainId as SupportedInterfaceChainId] === false;
      return chainIsNotEnabled ? false : isSupportedChainId(chainId);
    },
    [featureFlaggedChains]
  );
}

export function useSupportedChainId(
  chainId?: number
): SupportedInterfaceChainId | undefined {
  const featureFlaggedChains = useFeatureFlaggedChainIds();
  if (!chainId || SUPPORTED_INTERFACE_CHAIN_IDS.indexOf(chainId) === -1) {
    return;
  }

  const chainDisabled =
    featureFlaggedChains[chainId as SupportedInterfaceChainId] === false;
  return chainDisabled ? undefined : (chainId as SupportedInterfaceChainId);
}

export type InterfaceGqlChain = Exclude<
  BackendChainId,
  BackendChainId.UnknownChain
>;

const MAINNET = UNIVERSE_CHAIN_INFO[UniverseChainId.MAINNET];
const ARBITRUM = UNIVERSE_CHAIN_INFO[UniverseChainId.ArbitrumOne];
const ARBITRUM_GOERLI = UNIVERSE_CHAIN_INFO[UniverseChainId.ARBITRUM_GOERLI];
const AVALANCHE = UNIVERSE_CHAIN_INFO[UniverseChainId.AVALANCHE];
const BASE = UNIVERSE_CHAIN_INFO[UniverseChainId.Base];
const BLAST = UNIVERSE_CHAIN_INFO[UniverseChainId.Blast];
const BNB = UNIVERSE_CHAIN_INFO[UniverseChainId.BNB];
const CELO = UNIVERSE_CHAIN_INFO[UniverseChainId.CELO];
const CELO_ALFAJORES = UNIVERSE_CHAIN_INFO[UniverseChainId.CELO_ALFAJORES];
const GOERLI = UNIVERSE_CHAIN_INFO[UniverseChainId.Goerli];
const OPTIMISM = UNIVERSE_CHAIN_INFO[UniverseChainId.Optimism];
const OPTIMISM_GOERLI = UNIVERSE_CHAIN_INFO[UniverseChainId.OPTIMISM_GOERLI];
const POLYGON = UNIVERSE_CHAIN_INFO[UniverseChainId.Polygon];
const POLYGON_MUMBAI = UNIVERSE_CHAIN_INFO[UniverseChainId.PolygonMumbai];
const SEPOLIA = UNIVERSE_CHAIN_INFO[UniverseChainId.SEPOLIA];
const ZORA = UNIVERSE_CHAIN_INFO[UniverseChainId.ZORA];
const ZKSYNC = UNIVERSE_CHAIN_INFO[UniverseChainId.ZKSYNC];
const TARAXA_TESTNET = UNIVERSE_CHAIN_INFO[UniverseChainId.TARAXA_TESTNET];
const TARAXA = UNIVERSE_CHAIN_INFO[UniverseChainId.TARAXA];

const INTERFACE_SUPPORTED_CHAINS = [
  MAINNET,
  GOERLI,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_GOERLI,
  ARBITRUM,
  ARBITRUM_GOERLI,
  POLYGON,
  POLYGON_MUMBAI,
  AVALANCHE,
  CELO,
  CELO_ALFAJORES,
  BNB,
  BASE,
  BLAST,
  ZORA,
  ZKSYNC,
  TARAXA_TESTNET,
  TARAXA,
] as const;

type ExtractObject<
  TObject extends Record<string, unknown>,
  TNarrowedObject extends Partial<TObject>
> = Extract<TObject, TNarrowedObject>;
export type SupportedInterfaceChain<
  partialChain extends Partial<
    (typeof INTERFACE_SUPPORTED_CHAINS)[number]
  > = Partial<(typeof INTERFACE_SUPPORTED_CHAINS)[number]>
> = ExtractObject<(typeof INTERFACE_SUPPORTED_CHAINS)[number], partialChain>;
export type SupportedInterfaceChainId = SupportedInterfaceChain["id"];
type ChainInfoMap = {
  readonly [chainId in SupportedInterfaceChainId]: SupportedInterfaceChain;
};

export const CHAIN_INFO: ChainInfoMap = {
  [ChainId.MAINNET]: MAINNET,
  [ChainId.GOERLI]: GOERLI,
  [ChainId.SEPOLIA]: SEPOLIA,
  [ChainId.OPTIMISM]: OPTIMISM,
  [ChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI,
  [ChainId.ARBITRUM_ONE]: ARBITRUM,
  [ChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI,
  [ChainId.POLYGON]: POLYGON,
  [ChainId.POLYGON_MUMBAI]: POLYGON_MUMBAI,
  [ChainId.CELO]: CELO,
  [ChainId.CELO_ALFAJORES]: CELO_ALFAJORES,
  [ChainId.BNB]: BNB,
  [ChainId.AVALANCHE]: AVALANCHE,
  [ChainId.BASE]: BASE,
  [ChainId.BLAST]: BLAST,
  [ChainId.ZORA]: ZORA,
  [ChainId.ZKSYNC]: ZKSYNC,
  [ChainId.TARAXA_TESTNET]: TARAXA_TESTNET,
  [ChainId.TARAXA]: TARAXA,
} as const;

export type ChainSlug = SupportedInterfaceChain["urlParam"];
export const isChainUrlParam = (str?: string): str is ChainSlug =>
  !!str && Object.values(CHAIN_INFO).some((chain) => chain.urlParam === str);
export const getChainUrlParam = (str?: string): ChainSlug | undefined =>
  isChainUrlParam(str) ? str : undefined;

export function getChain(options: {
  chainId: SupportedInterfaceChainId;
}): SupportedInterfaceChain;
export function getChain(options: {
  chainId?: SupportedInterfaceChainId;
  withFallback: true;
}): SupportedInterfaceChain;
export function getChain(options: {
  chainId?: SupportedInterfaceChainId;
  withFallback?: boolean;
}): SupportedInterfaceChain | undefined;
export function getChain({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId;
  withFallback?: boolean;
}): SupportedInterfaceChain | undefined {
  return chainId
    ? CHAIN_INFO[chainId]
    : withFallback
    ? CHAIN_INFO[ChainId.MAINNET]
    : undefined;
}

export const CHAIN_IDS_TO_NAMES = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [key, value.interfaceName])
) as { [chainId in SupportedInterfaceChainId]: string };

export const GQL_MAINNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => !chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain);

const GQL_TESTNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain);

export const UX_SUPPORTED_GQL_CHAINS = [
  ...GQL_MAINNET_CHAINS,
  ...GQL_TESTNET_CHAINS,
];

export const CHAIN_ID_TO_BACKEND_NAME = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [
    key,
    value.backendChain.chain,
  ])
) as { [chainId in SupportedInterfaceChainId]: InterfaceGqlChain };

export function chainIdToBackendChain(options: {
  chainId: SupportedInterfaceChainId;
}): InterfaceGqlChain;
export function chainIdToBackendChain(options: {
  chainId?: SupportedInterfaceChainId;
  withFallback: true;
}): InterfaceGqlChain;
export function chainIdToBackendChain(options: {
  chainId?: SupportedInterfaceChainId;
  withFallback?: boolean;
}): InterfaceGqlChain | undefined;
export function chainIdToBackendChain({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId;
  withFallback?: boolean;
}): InterfaceGqlChain | undefined {
  return chainId
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : withFallback
    ? CHAIN_ID_TO_BACKEND_NAME[ChainId.MAINNET]
    : undefined;
}

export const CHAIN_NAME_TO_CHAIN_ID = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !value.backendChain.isSecondaryChain)
    .map(([key, value]) => [
      value.backendChain.chain,
      parseInt(key) as SupportedInterfaceChainId,
    ])
) as { [chain in InterfaceGqlChain]: SupportedInterfaceChainId };

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter(
    (key) =>
      CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId]
        .supportsGasEstimates
  )
  .map((key) => parseInt(key) as SupportedInterfaceChainId);

export const TESTNET_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter(
    (key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].testnet
  )
  .map((key) => parseInt(key) as SupportedInterfaceChainId);

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter(
    (key) =>
      CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].networkLayer ===
      NetworkLayer.L1
  )
  .map((key) => parseInt(key) as SupportedInterfaceChainId);

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter(
    (key) =>
      CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].networkLayer ===
      NetworkLayer.L2
  )
  .map((key) => parseInt(key) as SupportedInterfaceChainId);

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number];

/**
 * @deprecated when v2 pools are enabled on chains supported through sdk-core
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map(
  (chainId) => parseInt(chainId)
);

export const BACKEND_SUPPORTED_CHAINS = Object.keys(CHAIN_INFO)
  .filter((key) => {
    const chainId = parseInt(key) as SupportedInterfaceChainId;
    return (
      CHAIN_INFO[chainId].backendChain.backendSupported &&
      !CHAIN_INFO[chainId].backendChain.isSecondaryChain &&
      !CHAIN_INFO[chainId].testnet
    );
  })
  .map(
    (key) =>
      CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].backendChain
        .chain as InterfaceGqlChain
  );

export const BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS = GQL_MAINNET_CHAINS.filter(
  (chain) => !BACKEND_SUPPORTED_CHAINS.includes(chain)
).map((chain) => CHAIN_NAME_TO_CHAIN_ID[chain]) as [SupportedInterfaceChainId];

export const INFURA_PREFIX_TO_CHAIN_ID: {
  [prefix: string]: SupportedInterfaceChainId;
} = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !!value.infuraPrefix)
    .map(([key, value]) => [
      value.infuraPrefix,
      parseInt(key) as SupportedInterfaceChainId,
    ])
);

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId): number {
  if (isSupportedChainId(chainId)) {
    return CHAIN_INFO[chainId].chainPriority;
  }

  return Infinity;
}

export function isUniswapXSupportedChain(chainId?: number) {
  return chainId === ChainId.MAINNET;
}

export function isStablecoin(currency?: Currency): boolean {
  if (!currency) {
    return false;
  }

  return getChain({
    chainId: currency.chainId as SupportedInterfaceChainId,
  }).stablecoins.some((stablecoin) => stablecoin.equals(currency));
}

export function getChainFromChainUrlParam(
  chainUrlParam?: ChainSlug
): SupportedInterfaceChain | undefined {
  return chainUrlParam !== undefined
    ? Object.values(CHAIN_INFO).find(
        (chain) => chainUrlParam === chain.urlParam
      )
    : undefined;
}

export function useChainFromUrlParam(): SupportedInterfaceChain | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName;
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab;
  return getChainFromChainUrlParam(getChainUrlParam(chainName ?? tab));
}
