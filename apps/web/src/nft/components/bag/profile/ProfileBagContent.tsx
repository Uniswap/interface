import ProfileAssetRow from 'nft/components/bag/profile/ProfileAssetRow'
import { useSellAsset } from 'nft/hooks'
import { Flex } from 'ui/src'

export const ProfileBagContent = () => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  return (
    <Flex width="100%" gap="$gap12">
      {sellAssets.length ? sellAssets.map((asset, index) => <ProfileAssetRow asset={asset} key={index} />) : null}
    </Flex>
  )
}
