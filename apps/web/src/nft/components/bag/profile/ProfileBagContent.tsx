import { Column } from 'nft/components/Flex'
import ProfileAssetRow from 'nft/components/bag/profile/ProfileAssetRow'
import { useSellAsset } from 'nft/hooks'

export const ProfileBagContent = () => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  return (
    <Column>
      {sellAssets.length ? sellAssets.map((asset, index) => <ProfileAssetRow asset={asset} key={index} />) : null}
    </Column>
  )
}
