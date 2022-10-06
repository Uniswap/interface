import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { bodySmall, subhead } from 'nft/css/common.css'
import { useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useState } from 'react'

import * as styles from './ProfileAssetRow.css'

const ProfileAssetRow = ({ asset }: { asset: WalletAsset }) => {
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const isMobile = useIsMobile()
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  return (
    <Row paddingY="8" position="relative" onMouseEnter={handleHover} onMouseLeave={handleHover}>
      <div>
        <Box
          display={isMobile ? 'flex' : 'none'}
          className={styles.removeAsset}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            removeAsset(asset)
          }}
        >
          <img className={styles.removeIcon} src={'/nft/svgs/minusCircle.svg'} alt="Remove item" />
        </Box>
        <img className={styles.tagAssetImage} src={asset.image_url} alt={asset.name} />
      </div>
      <Column gap="4" overflow="hidden" flexWrap="nowrap">
        <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" className={subhead}>
          {asset.name ?? `#${asset.tokenId}`}
        </Box>
        <Box overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" className={bodySmall}>
          {asset.collection?.name}
        </Box>
      </Column>
      {hovered && !isMobile && (
        <Box
          marginLeft="auto"
          marginRight="0"
          className={styles.removeBagRowButton}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            removeAsset(asset)
          }}
        >
          Remove
        </Box>
      )}
    </Row>
  )
}

export default ProfileAssetRow
