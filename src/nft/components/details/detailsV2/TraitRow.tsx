import Column from 'components/Column'
import Row from 'components/Row'
import { Trait } from 'nft/types'
import { formatEth, getLinkForTrait } from 'nft/utils'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import { getRarityLevel, RarityGraph } from './RarityGraph'

const TraitRowLink = styled(Link)`
  text-decoration: none;
`

const SubheaderTiny = styled.div<{ $color?: string }>`
  font-size: 10px;
  line-height: 16px;
  font-weight: 600;
  color: ${({ theme, $color }) => ($color ? $color : theme.textSecondary)};
`

const SubheaderTinyHidden = styled(SubheaderTiny)`
  opacity: 0;
`

const TraitRowContainer = styled(Row)`
  padding: 12px 18px 12px 12px;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
  &:hover {
    background: ${({ theme }) => theme.hoverDefault};
    ${SubheaderTinyHidden} {
      opacity: 1;
    }
  }
`

const TraitColumnValue = styled(Column)<{ $flex?: number; $alignItems?: string }>`
  gap: 4px;
  flex: ${({ $flex }) => $flex ?? 3};
  align-items: ${({ $alignItems }) => $alignItems};
`

const TraitRowValue = styled(ThemedText.BodySmall)<{ $flex?: number; $justifyContent?: string; hideOnSmall?: boolean }>`
  display: flex;
  line-height: 20px;
  padding-top: 20px;
  flex: ${({ $flex }) => $flex ?? 1};
  justify-content: ${({ $justifyContent }) => $justifyContent};

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: ${({ hideOnSmall }) => (hideOnSmall ? 'none' : 'flex')};
  }
`

export const TraitRow = ({ trait, collectionAddress }: { trait: Trait; collectionAddress: string }) => {
  // TODO(NFT-1189): Replace with actual rarity, count, and floor price when BE supports
  // rarity eventually should be number of items with this trait / total number of items, smaller rarity means more rare
  const randomRarity = Math.random()
  const rarityLevel = getRarityLevel(randomRarity)

  return (
    <TraitRowLink to={getLinkForTrait(trait, collectionAddress)}>
      <TraitRowContainer>
        <TraitColumnValue>
          <SubheaderTiny>{trait.trait_type}</SubheaderTiny>
          <ThemedText.BodyPrimary lineHeight="20px">{trait.trait_value}</ThemedText.BodyPrimary>
        </TraitColumnValue>
        <TraitRowValue $flex={2}>{formatEth(randomRarity * 1000)} ETH</TraitRowValue>
        <TraitRowValue hideOnSmall={true}>{Math.round(randomRarity * 10000)}</TraitRowValue>
        <TraitColumnValue $flex={1.5} $alignItems="flex-end">
          <SubheaderTinyHidden $color={rarityLevel.color}>{rarityLevel.caption}</SubheaderTinyHidden>
          <RarityGraph trait={trait} rarity={randomRarity} />
        </TraitColumnValue>
      </TraitRowContainer>
    </TraitRowLink>
  )
}
