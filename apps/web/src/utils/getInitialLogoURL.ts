import { getChain, isSupportedChainId } from 'constants/chains'
import { CELO_LOGO } from 'ui/src/assets'
import { GRG, isCelo, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isAddress } from 'utilities/src/addresses'

export function getInitialLogoUrl(
  address?: string | null,
  chainId?: number | null,
  isNative?: boolean,
  backupImg?: string | null,
) {
  const networkName = isSupportedChainId(chainId)
    ? getChain({ chainId }).assetRepoNetworkName ?? 'ethereum'
    : 'ethereum'
  const checksummedAddress = isAddress(address)

  if (
    (address === GRG[UniverseChainId.ArbitrumOne].address ||
      address === GRG[UniverseChainId.Base].address ||
      address === GRG[UniverseChainId.Bnb].address ||
      address === GRG[UniverseChainId.Optimism].address ||
      address === GRG[UniverseChainId.Polygon].address) &&
    checksummedAddress
  ) {
    return logo
  }

  if (chainId && isCelo(chainId) && address === nativeOnChain(chainId).wrapped.address) {
    return CELO_LOGO
  }

  if (checksummedAddress) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}
