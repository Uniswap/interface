import { ChainTokenMap } from 'lib/hooks/useTokenList/utils';
import { AppState } from '../index';
export declare type TokenAddressMap = ChainTokenMap;
export declare function useAllLists(): AppState['lists']['byUrl'];
/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
export declare function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap;
export declare function useActiveListUrls(): string[] | undefined;
export declare function useInactiveListUrls(): string[];
export declare function useCombinedActiveList(): TokenAddressMap;
export declare function useUnsupportedTokenList(): TokenAddressMap;
export declare function useIsListActive(url: string): boolean;
