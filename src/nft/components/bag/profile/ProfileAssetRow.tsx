import { ButtonEmphasis, ButtonSize } from 'components/Button'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { CircularCloseIcon, VerifiedIcon } from 'nft/components/icons'
import { useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'

import { RemoveButton } from '../BagRow'
import * as styles from '../BagRow.css'

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
        <Box
          display={isMobile ? 'block' : 'none'}
          className={styles.removeAssetOverlay}
          onClick={handleRemoveAsset}
          transition="250"
          zIndex="1"
        >
          <CircularCloseIcon />
        </Box>
        <img src={asset.smallImageUrl} alt={asset.name} className={styles.bagRowImage} />
      </Box>
      <Column overflow="hidden" width="full" color="textPrimary">
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
