import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { RemoveAssetButton } from 'nft/components/bag/BagRow'
import { VerifiedIcon } from 'nft/components/icons'
import { useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'
import { Button, Flex, Image, Text, TouchableAreaEvent } from 'ui/src'

const ProfileAssetRow = ({ asset }: { asset: WalletAsset }) => {
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  const handleRemoveAsset = (e: TouchableAreaEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    removeAsset(asset)
  }

  return (
    <Flex
      row
      px="$spacing12"
      py="$spacing8"
      gap="$gap12"
      cursor="pointer"
      borderRadius="$rounded12"
      onMouseEnter={handleHover}
      onMouseLeave={handleHover}
      overflow="hidden"
      hoverStyle={{ backgroundColor: '$surface3' }}
    >
      <Flex>
        {isMobile && <RemoveAssetButton onClick={handleRemoveAsset} />}
        <Image
          src={asset.smallImageUrl}
          alt={asset.name}
          width={56}
          height={56}
          objectFit="cover"
          borderRadius="$rounded8"
        />
      </Flex>
      <Flex overflow="hidden" width="100%">
        <Flex
          row
          overflow="hidden"
          width="full"
          justifyContent="space-between"
          $platform-web={{ whiteSpace: 'nowrap' }}
          gap="$spacing16"
        >
          <Text color="$neutral1" variant="body2">
            {asset.name || `#${asset.tokenId}`}
          </Text>
        </Flex>
        <Flex row overflow="hidden" $platform-web={{ whiteSpace: 'nowrap' }} gap="$spacing2">
          <Text variant="body3" color="$neutral2" textOverflow="ellipsis" maxWidth="80%">
            {asset.asset_contract.name}
          </Text>
          {asset.collectionIsVerified && <VerifiedIcon style={{ flexShrink: 0 }} />}
        </Flex>
      </Flex>
      {hovered && !isMobile && (
        <Button
          size="small"
          onPress={handleRemoveAsset}
          right="$spacing16"
          borderRadius="$rounded12"
          position="absolute"
        >
          Remove
        </Button>
      )}
    </Flex>
  )
}

export default ProfileAssetRow
