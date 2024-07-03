import celoLogo from 'assets/svg/celo_logo.svg'
import logo from 'assets/svg/logo.svg'
import { getChain, isSupportedChainId } from 'constants/chains'
import { GRG, isCelo, nativeOnChain } from 'constants/tokens'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isAddress } from 'utilities/src/addresses'

export function getInitialLogoUrl(
  address?: string | null,
  chainId?: number | null,
  isNative?: boolean,
  backupImg?: string | null
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
    return celoLogo
  }

  if (checksummedAddress) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}
