import { Box } from 'nft/components/Box'
import { RarityVerified } from 'nft/components/icons'
import { putCommas } from 'nft/utils/putCommas'
import { getRarityProviderLogo } from 'nft/utils/rarity'
import { TokenRarity } from '../../types'
import * as styles from './Rarity.css'

interface RarityProps {
  rarity: TokenRarity
  rarityVerified: boolean
  collectionName: string
}

export const Rarity = ({ rarity, rarityVerified, collectionName }: RarityProps) => {
  const rarityProviderLogo = getRarityProviderLogo(rarity.source)

  return (
    <Box className={styles.rarityInfo}>
      <Box paddingTop="2" paddingBottom="2" display="flex">
        {putCommas(rarity.rank)}
      </Box>

      <Box display="flex" height="16">
        {rarityVerified ? <RarityVerified /> : null}
      </Box>
    </Box>
  )
}
