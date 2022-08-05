import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from '@ethersproject/contracts'

import ERC721 from '../../abis/erc721.json'
import { TokenType } from '../types'

export const isAssetOwnedByUser = async ({
  tokenId,
  assetAddress,
  userAddress,
  tokenType,
  provider,
}: {
  tokenId: string
  assetAddress: string
  userAddress: string
  tokenType: TokenType
  provider: Provider
}) => {
  if (tokenType === TokenType.ERC721) {
    const c = new Contract(assetAddress, ERC721, provider)

    return (await c.functions.ownerOf(tokenId)) === userAddress
  } else return false
}
