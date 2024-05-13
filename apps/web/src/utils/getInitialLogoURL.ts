import { getChainInfo, isSupportedChainId } from 'constants/chains'
import { isCelo, nativeOnChain } from 'constants/tokens'
import { isAddress } from 'utilities/src/addresses'
import celoLogo from '../assets/svg/celo_logo.svg'

export function getInitialLogoUrl(
  address?: string | null,
  chainId?: number | null,
  isNative?: boolean,
  backupImg?: string | null
) {
  const networkName = isSupportedChainId(chainId)
    ? getChainInfo({ chainId }).assetRepoNetworkName ?? 'ethereum'
    : 'ethereum'
  const checksummedAddress = isAddress(address)

  if (chainId && isCelo(chainId) && address === nativeOnChain(chainId).wrapped.address) {
    return celoLogo
  }

  if (checksummedAddress) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}
