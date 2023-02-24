import { diffTokenLists } from './diffTokenLists';
import { VersionUpgrade } from './getVersionUpgrade';
import { TokenInfo } from './types';

/**
 * Returns the minimum version bump for the given list
 * @param baseList the base list of tokens
 * @param updatedList the updated list of tokens
 */
export function minVersionBump(
  baseList: TokenInfo[],
  updatedList: TokenInfo[]
): VersionUpgrade {
  const diff = diffTokenLists(baseList, updatedList);
  if (diff.removed.length > 0) return VersionUpgrade.MAJOR;
  if (diff.added.length > 0) return VersionUpgrade.MINOR;
  if (Object.keys(diff.changed).length > 0) return VersionUpgrade.PATCH;
  return VersionUpgrade.NONE;
}
