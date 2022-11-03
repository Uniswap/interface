import { Trait } from 'nft/hooks'
import qs from 'query-string'

import { badge } from '../../css/common.css'
import { Box } from '../Box'
import { Column } from '../Flex'
import * as styles from './Traits.css'

const TraitRow: React.FC<Trait> = ({ trait_type, trait_value }: Trait) => (
  <Column backgroundColor="backgroundSurface" padding="16" gap="4" borderRadius="12">
    <Box
      as="span"
      className={badge}
      color="textSecondary"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      style={{ textTransform: 'uppercase' }}
      maxWidth={{ sm: '120', md: '160' }}
    >
      {trait_type}
    </Box>

    <Box
      as="span"
      color="textPrimary"
      fontSize="16"
      fontWeight="normal"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      maxWidth={{ sm: '120', md: '160' }}
    >
      {trait_value}
    </Box>
  </Column>
)

export const Traits = ({ traits, collectionAddress }: { traits: Trait[]; collectionAddress: string }) => (
  <div className={styles.grid}>
    {traits.length === 0
      ? 'No traits'
      : traits.map((item) => {
          const params = qs.stringify(
            { traits: [`("${item.trait_type}","${item.trait_value}")`] },
            {
              arrayFormat: 'comma',
            }
          )

          return (
            <a
              key={`${item.trait_type}-${item.trait_value}`}
              href={`#/nfts/collection/${collectionAddress}?${params}`}
              style={{ textDecoration: 'none' }}
            >
              <TraitRow trait_type={item.trait_type} trait_value={item.trait_value} />
            </a>
          )
        })}
  </div>
)
