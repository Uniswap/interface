import { CollectionInfoForAsset, GenieAsset, Trait } from 'nft/types'
import styled from 'styled-components/macro'
import qs from 'query-string'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

const GridItemContainer = styled.a`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  cursor: pointer;
  padding: 12px;
  text-decoration: none;

  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `opacity ${duration.medium} ${timing.ease}`};
  }
`

const TraitType = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
`

const TraitValue = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 12px;
  line-height: 24px;
  margin-top: 4px;
`

const TraitPercentage = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 12px;
  line-height: 16px;
  margin-top: 4px;
`

const GridItem = ({
  trait,
  totalSupply,
  collectionAddress,
}: {
  trait: Trait
  totalSupply: number
  collectionAddress: string
}) => {
  const percentage = ((trait.trait_count / totalSupply) * 100).toFixed(0)
  const params = qs.stringify(
    { traits: [`("${trait.trait_type}","${trait.value}")`] },
    {
      arrayFormat: 'comma',
    }
  )

  // /#/nfts/collection/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb
  return (
    <GridItemContainer href={`#/nfts/collection/${collectionAddress}?${params}`}>
      <TraitType>{trait.trait_type}</TraitType>
      <TraitValue>{trait.value}</TraitValue>
    </GridItemContainer>
  )
}

const TraitsContainer = ({ asset, collection }: { asset: GenieAsset; collection: CollectionInfoForAsset }) => {
  const traits = asset.traits?.sort((a, b) => a.trait_type.localeCompare(b.trait_type))

  return (
    <Grid>
      {traits?.map((trait) => {
        return <GridItem trait={trait} totalSupply={collection.totalSupply} collectionAddress={asset.address} />
      })}
    </Grid>
  )
}

export default TraitsContainer
