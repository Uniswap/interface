import { NFTItem } from 'wallet/src/features/nfts/types'

export type NftViewProps = {
  item: NFTItem
  index?: number
  onPress: () => void
}

export type NftViewWithContextMenuProps = NftViewProps & {
  owner: Address
}
