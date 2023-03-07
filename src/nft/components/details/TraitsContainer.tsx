import { OpacityHoverState } from 'components/Common'
import { GenieAsset, Trait } from 'nft/types'
import qs from 'query-string'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
  max-width: 780px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr 1fr 1fr;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr 1fr;
  }
`

const GridItemContainer = styled(Link)`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  cursor: pointer;
  padding: 12px;
  text-decoration: none;

  ${OpacityHoverState}
  min-width: 0;
`

const TraitType = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  white-space: nowrap;
  width: 100%;
`

const TraitValue = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px;
  line-height: 24px;
  margin-top: 4px;
  display: inline-block;

  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
`

const GridItem = ({ trait, collectionAddress }: { trait: Trait; collectionAddress: string }) => {
  const { trait_type, trait_value } = trait
  const params = qs.stringify(
    { traits: [`("${trait_type}","${trait_value}")`] },
    {
      arrayFormat: 'comma',
    }
  )

  return (
    <GridItemContainer to={`/nfts/collection/${collectionAddress}?${params}`}>
      <TraitType>{trait_type}</TraitType>
      <TraitValue>{trait_value}</TraitValue>
    </GridItemContainer>
  )
}

const TraitsContainer = ({ asset }: { asset: GenieAsset }) => {
  const traits = useMemo(() => asset.traits?.sort((a, b) => a.trait_type.localeCompare(b.trait_type)), [asset])

  return (
    <Grid>
      {traits?.map((trait) => {
        return <GridItem key={trait.trait_type} trait={trait} collectionAddress={asset.address} />
      })}
    </Grid>
  )
}

export default TraitsContainer
