import { Column } from 'nft/components/Flex'
import { useSellAsset } from 'nft/hooks'

import ProfileAssetRow from './ProfileAssetRow'

export const ProfileBagContent = () => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  return (
    <Column>
      {sellAssets.length ? sellAssets.map((asset, index) => <ProfileAssetRow asset={asset} key={index} />) : null}
    </Column>
  )
}
