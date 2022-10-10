import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { BagCloseIcon } from 'nft/components/icons'
import { roundAndPluralize } from 'nft/utils/roundAndPluralize'

import * as styles from './BagHeader.css'

interface BagHeaderProps {
  numberOfAssets: number
  toggleBag: () => void
  resetFlow: () => void
  isProfilePage: boolean
}

export const BagHeader = ({ numberOfAssets, toggleBag, resetFlow, isProfilePage }: BagHeaderProps) => {
  return (
    <Column gap="4" paddingX="32" marginBottom="20">
      <Row className={styles.header}>
        {isProfilePage ? 'Sell NFTs' : 'My bag'}
        <Box display="flex" padding="2" color="textSecondary" cursor="pointer" onClick={toggleBag}>
          <BagCloseIcon />
        </Box>
      </Row>
      {numberOfAssets > 0 && (
        <Box fontSize="14" fontWeight="normal" style={{ lineHeight: '20px' }} color="textPrimary">
          {roundAndPluralize(numberOfAssets, 'NFT')} ·{' '}
          <Box
            as="span"
            className={styles.clearAll}
            onClick={() => {
              resetFlow()
            }}
          >
            Clear all
          </Box>
        </Box>
      )}
    </Column>
  )
}
