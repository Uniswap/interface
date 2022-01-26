import { Percent, Token } from '@uniswap/sdk-core';
import { Pair } from '@uniswap/v2-sdk';
import { SupportedLocale } from 'constants/locales';
export declare function useIsDarkMode(): boolean;
export declare function useDarkModeManager(): [boolean, () => void];
export declare function useUserLocale(): SupportedLocale | null;
export declare function useUserLocaleManager(): [SupportedLocale | null, (newLocale: SupportedLocale) => void];
export declare function useIsExpertMode(): boolean;
export declare function useExpertModeManager(): [boolean, () => void];
export declare function useShowSurveyPopup(): [boolean | undefined, (showPopup: boolean) => void];
export declare function useClientSideRouter(): [boolean, (userClientSideRouter: boolean) => void];
export declare function useSetUserSlippageTolerance(): (slippageTolerance: Percent | 'auto') => void;
/**
 * Return the user's slippage tolerance, from the redux store, and a function to update the slippage tolerance
 */
export declare function useUserSlippageTolerance(): Percent | 'auto';
export declare function useUserHideClosedPositions(): [boolean, (newHideClosedPositions: boolean) => void];
/**
 * Same as above but replaces the auto with a default value
 * @param defaultSlippageTolerance the default value to replace auto with
 */
export declare function useUserSlippageToleranceWithDefault(defaultSlippageTolerance: Percent): Percent;
export declare function useUserTransactionTTL(): [number, (slippage: number) => void];
export declare function useAddUserToken(): (token: Token) => void;
export declare function useRemoveUserAddedToken(): (chainId: number, address: string) => void;
export declare function useUserAddedTokens(): Token[];
export declare function usePairAdder(): (pair: Pair) => void;
export declare function useURLWarningVisible(): boolean;
/**
 * Given two tokens return the liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
export declare function toV2LiquidityToken([tokenA, tokenB]: [Token, Token]): Token;
/**
 * Returns all the pairs of tokens that are tracked by the user for the current chain ID.
 */
export declare function useTrackedTokenPairs(): [Token, Token][];
