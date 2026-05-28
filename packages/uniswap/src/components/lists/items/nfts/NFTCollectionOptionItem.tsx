import { Text, UniversalImage } from 'ui/src'
import { Verified } from 'ui/src/components/icons/Verified'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { OptionItem, OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import { NFTCollectionOption } from 'uniswap/src/components/lists/items/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { uriToHttpUrls } from 'utilities/src/format/urls'

type NFTCollectionOptionItemProps = {
  collectionOption: NFTCollectionOption
  onPress: OptionItemProps['onPress']
}

export function NFTCollectionOptionItem({ collectionOption, onPress }: NFTCollectionOptionItemProps): JSX.Element {
  const { name, isVerified, imageUrl } = collectionOption

  return (
    <OptionItem
      image={
        <UniversalImage
          fallback={
            <Text color="$neutral1" numberOfLines={1} textAlign="center">
              {name.slice(0, 1)}
            </Text>
          }
          uri={imageUrl ? uriToHttpUrls(imageUrl)[0] : undefined}
          autoplay={false}
          size={{ width: iconSizes.icon40, height: iconSizes.icon40 }}
          style={{ image: { borderRadius: borderRadii.roundedFull } }}
        />
      }
      title={name}
      badge={isVerified ? <Verified color="$accent1" size="$icon.16" /> : undefined}
      testID={TestID.SearchNFTCollectionItem}
      onPress={onPress}
    />
  )
}
