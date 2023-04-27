import Column from 'components/Column'
import Row from 'components/Row'
import { Trait } from 'nft/types'
import { formatEth } from 'nft/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { RarityGraph } from './RarityGraph'

const SubheaderTiny = styled.div`
  font-size: 10px;
  line-height: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.textSecondary};
`

const TraitValue = styled(Column)`
  gap: 4px;
  flex: 3;
`

const TraitRowValue = styled(ThemedText.BodySmall)<{ $flex?: number; alignRight?: boolean }>`
  display: flex;
  line-height: 20px;
  padding-top: 20px;
  flex: ${({ $flex }) => $flex ?? 1};
  ${({ alignRight }) => alignRight && 'justify-content: flex-end'};
`

export const TraitRow = ({ trait }: { trait: Trait }) => {
  // TODO: Replace with actual rarity, count, and floor price when BE supports
  const randomRarity = Math.random()
  return (
    <Row padding="12px 0px">
      <TraitValue>
        <SubheaderTiny>{trait.trait_type}</SubheaderTiny>{' '}
        <ThemedText.BodyPrimary lineHeight="20px">{trait.trait_value}</ThemedText.BodyPrimary>
      </TraitValue>
      <TraitRowValue $flex={2}>{formatEth(randomRarity * 1000)} ETH</TraitRowValue>
      <TraitRowValue>{Math.round(randomRarity * 10000)}</TraitRowValue>
      <TraitRowValue $flex={1.5} alignRight={true}>
        <RarityGraph trait={trait} rarity={randomRarity} />
      </TraitRowValue>
    </Row>
  )
}
