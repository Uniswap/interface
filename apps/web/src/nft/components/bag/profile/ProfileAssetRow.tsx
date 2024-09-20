import { ButtonEmphasis, ButtonSize } from 'components/Button/buttons'
import { Box } from 'components/deprecated/Box'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { Column, Row } from 'nft/components/Flex'
import { RemoveAssetButton, RemoveButton } from 'nft/components/bag/BagRow'
import * as styles from 'nft/components/bag/BagRow.css'
import { VerifiedIcon } from 'nft/components/icons'
import { useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'

const ProfileAssetRow = ({ asset }: { asset: WalletAsset }) => {
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  const handleRemoveAsset: React.MouseEventHandler<HTMLElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    removeAsset(asset)
  }

  return (
    <Row className={styles.bagRow} onMouseEnter={handleHover} onMouseLeave={handleHover}>
      <Box position="relative" display="flex">
        {isMobile && <RemoveAssetButton onClick={handleRemoveAsset} />}
        <img src={asset.smallImageUrl} alt={asset.name} className={styles.bagRowImage} />
      </Box>
      <Column overflow="hidden" width="full" color="neutral1">
        <Row overflow="hidden" width="full" justifyContent="space-between" whiteSpace="nowrap" gap="16">
          <Box className={styles.assetName}>{asset.name || `#${asset.tokenId}`}</Box>
        </Row>
        <Row overflow="hidden" whiteSpace="nowrap" gap="2">
          <Box className={styles.collectionName}>{asset.asset_contract.name}</Box>
          {asset.collectionIsVerified && <VerifiedIcon className={styles.icon} />}
        </Row>
      </Column>
      {hovered && !isMobile && (
        <RemoveButton onClick={handleRemoveAsset} emphasis={ButtonEmphasis.medium} size={ButtonSize.medium}>
          Remove
        </RemoveButton>
      )}
    </Row>
  )
}

export default ProfileAssetRow
