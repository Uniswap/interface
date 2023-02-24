import { VersionUpgrade } from './getVersionUpgrade';
import { TokenInfo } from './types';
/**
 * Returns the minimum version bump for the given list
 * @param baseList the base list of tokens
 * @param updatedList the updated list of tokens
 */
export declare function minVersionBump(baseList: TokenInfo[], updatedList: TokenInfo[]): VersionUpgrade;
