import { CollectionInfoForAsset, GenieAsset, Trait } from 'nft/types'
import styled from 'styled-components/macro'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

const GridItemContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundModule};
  padding: 12px;
  border-radius: 12px;
`

const TraitType = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
`

const TraitValue = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px;
  line-height: 24px;
  margin-top: 4px;
`

const TraitPercentage = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 12px;
  line-height: 16px;
  margin-top: 4px;
`

const GridItem = ({ trait, totalSupply }: { trait: Trait; totalSupply: number }) => {
  const percentage = ((trait.trait_count / totalSupply) * 100).toFixed(0)

  return (
    <GridItemContainer>
      <TraitType>{trait.trait_type}</TraitType>
      <TraitValue>{trait.value}</TraitValue>
      <TraitPercentage>
        {percentage}% ({trait.trait_count}) have this
      </TraitPercentage>
    </GridItemContainer>
  )
}

const TraitsContainer = ({ asset, collection }: { asset: GenieAsset; collection: CollectionInfoForAsset }) => {
  const traits = asset.traits?.sort((a, b) => a.trait_type.localeCompare(b.trait_type))

  return (
    <Grid>
      {traits?.map((trait) => {
        return <GridItem trait={trait} totalSupply={collection.totalSupply} />
      })}
    </Grid>
  )
}

export default TraitsContainer
