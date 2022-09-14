import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { Column } from 'nft/components/Flex'

import MarketplacesImage from '../../../assets/images/nft-marketplaces.png'
import * as styles from './Explore.css'

const ValueProp = () => {
  return (
    <Box width="full">
      <Column as="section" className={styles.section}>
        <Box
          className={clsx(styles.bannerWrap, styles.valuePropWrap)}
          style={{
            height: '135px',
            backgroundImage: `url(${MarketplacesImage})`,
          }}
        >
          <Box className={styles.valuePropOverlay} width="full" />
          <Box className={styles.valuePropContent}>
            Discover, buy, and{' '}
            <Box as="span" color="pink400">
              sell NFTs
            </Box>{' '}
            across all NFT marketplaces
          </Box>
        </Box>
      </Column>
    </Box>
  )
}

export default ValueProp
