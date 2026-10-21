import { UniverseChainId, getValidAddress } from '@universe/chains'
import { CELO_LOGO } from '@universe/mycelium/assets'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'

export function getInitialLogoUrl({
  address,
  chainId,
  backupImg,
}: {
  address?: string | null
  chainId?: number | null
  backupImg?: string | null
}) {
  const networkName = isUniverseChainId(chainId)
    ? (getChainInfo(chainId).assetRepoNetworkName ?? 'ethereum')
    : 'ethereum'
  const checksummedAddress = getValidAddress({
    address,
    chainId: isUniverseChainId(chainId) ? chainId : UniverseChainId.Mainnet,
    withEVMChecksum: true,
  })

  if (chainId === UniverseChainId.Celo && address === nativeOnChain(chainId).wrapped.address) {
    // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
    return CELO_LOGO
  }

  if (checksummedAddress) {
    return `${UniswapStaticUrls.uniswapAssetsBlockchainsBaseUrl}/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}
