import { Box } from 'nft/components/Box'
import { bodySmall, subheadSmall } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useEffect, useRef, useState } from 'react'

import * as styles from './TagAssetRow.css'

const CartSellAssetRow = ({ asset }: { asset: WalletAsset }) => {
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)
  const assetRowRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (hovered && assetRowRef.current && assetRowRef.current.matches(':hover') === false) setHovered(false)
  }, [hovered])

  return (
    <Box display="flex" padding="4" marginBottom="4" borderRadius="8" position="relative">
      <Box
        onMouseEnter={handleHover}
        onMouseLeave={handleHover}
        onClick={() => {
          removeAsset(asset)
        }}
      >
        <Box visibility={hovered ? 'visible' : 'hidden'} className={styles.removeAsset}>
          <img className={styles.removeIcon} src={'/nft/svgs/minusCircle.svg'} alt="Remove item" />
        </Box>
        <img className={styles.tagAssetImage} src={asset.image_url} alt={asset.name} />
      </Box>
      <Box className={styles.tagAssetInfo}>
        <Box className={`${subheadSmall} ${styles.tagAssetName}`}>{asset.name || `#${asset.tokenId}`}</Box>
        <Box className={styles.tagAssetRowBottom}>
          <Box className={`${bodySmall} ${styles.tagAssetCollectionName}`}>{asset.collection?.name}</Box>
        </Box>
      </Box>
    </Box>
  )
}

export default CartSellAssetRow
