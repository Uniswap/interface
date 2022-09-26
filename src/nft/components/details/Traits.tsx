import qs from 'query-string'

import { badge } from '../../css/common.css'
import { Box } from '../Box'
import { Column } from '../Flex'
import * as styles from './Traits.css'

interface TraitProps {
  label: string
  value: string
}

const Trait: React.FC<TraitProps> = ({ label, value }: TraitProps) => (
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
      {label}
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
      {value}
    </Box>
  </Column>
)

export const Traits = ({
  traits,
  collectionAddress,
}: {
  traits: {
    value: string
    trait_type: string
  }[]
  collectionAddress: string
}) => (
  <div className={styles.grid}>
    {traits.length === 0
      ? 'No traits'
      : traits.map((item) => {
          const params = qs.stringify(
            { traits: [`("${item.trait_type}","${item.value}")`] },
            {
              arrayFormat: 'comma',
            }
          )

          return (
            <a
              key={`${item.trait_type}-${item.value}`}
              href={`#/nfts/collection/${collectionAddress}?${params}`}
              style={{ textDecoration: 'none' }}
            >
              <Trait label={item.trait_type} value={item.value} />
            </a>
          )
        })}
  </div>
)
