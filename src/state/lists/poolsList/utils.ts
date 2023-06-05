import { minVersionBump, TokenList, VersionUpgrade } from '@uniswap/token-lists'

export function shouldAcceptVersionUpdate(
  listUrl: string,
  current: TokenList,
  update: TokenList,
  targetBump: VersionUpgrade.PATCH | VersionUpgrade.MINOR
): boolean {
  const min = minVersionBump(current.tokens, update.tokens)
  // Automatically update minor/patch as long as bump matches the min update.
  if (targetBump >= min) {
    return true
  } else {
    console.debug(
      `List at url ${listUrl} could not automatically update because the version bump was only PATCH/MINOR while the update had breaking changes and should have been MAJOR`
    )
    return false
  }
}
