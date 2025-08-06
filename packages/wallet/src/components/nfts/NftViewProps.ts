import { NFTItem } from 'uniswap/src/features/nfts/types'

export type NftViewProps = {
  item: NFTItem
  index?: number
  onPress: () => void
  walletAddresses: Address[]
}

export type NftViewWithContextMenuProps = NftViewProps & {
  owner: Address
}
