import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { GenieAsset, Trait } from 'nft/types'
import { formatEth } from 'nft/utils'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Tab, TabbedComponent } from './TabbedComponent'

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

const TraitRow = ({ trait }: { trait: Trait }) => {
  // TODO: Replace with actual rarity, count, and floor price when BE supports
  const randomRarity = Math.random()
  return (
    <Row padding="12px 9px 12px 0px">
      <TraitValue>
        <SubheaderTiny>{trait.trait_type}</SubheaderTiny>{' '}
        <ThemedText.BodyPrimary lineHeight="20px">{trait.trait_value}</ThemedText.BodyPrimary>
      </TraitValue>
      <TraitRowValue $flex={2}>{formatEth(randomRarity * 1000)} ETH</TraitRowValue>
      <TraitRowValue>{Math.round(randomRarity * 10000)}</TraitRowValue>
      <TraitRowValue $flex={1.5} alignRight={true}>
        Bars
      </TraitRowValue>
    </Row>
  )
}

const TraitsContentContainer = styled(Column)`
  max-height: 432px;
  ${ScrollBarStyles}
`

const TraitsHeaderContainer = styled(Row)`
  padding-right: 12px;
`

const TraitsHeader = styled(ThemedText.SubHeaderSmall)<{ $flex?: number; alignRight?: boolean }>`
  display: flex;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
  flex: ${({ $flex }) => $flex ?? 1};
  ${({ alignRight }) => alignRight && 'justify-content: flex-end'};
`

const TraitRowContainer = styled.div`
  overflow-y: auto;
  overflow-x hidden;
  width: calc(100% + 12px);
`

const TraitsContent = ({ traits }: { traits?: Trait[] }) => {
  return (
    <TraitsContentContainer>
      <TraitsHeaderContainer>
        <TraitsHeader $flex={3}>
          <Trans>Trait</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader $flex={2}>
          <Trans>Floor price</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader>
          <Trans>Quantity</Trans>
        </TraitsHeader>{' '}
        <TraitsHeader $flex={1.5} alignRight={true}>
          <Trans>Rarity</Trans>
        </TraitsHeader>
      </TraitsHeaderContainer>
      <TraitRowContainer>
        {traits?.map((trait) => (
          <TraitRow trait={trait} key={trait.trait_type + ':' + trait.trait_value} />
        ))}
      </TraitRowContainer>
    </TraitsContentContainer>
  )
}

enum TraitTabsKeys {
  Traits = 'traits',
}

export const DataPageTraits = ({ asset }: { asset: GenieAsset }) => {
  const TraitTabs: Map<string, Tab> = useMemo(
    () =>
      new Map([
        [
          TraitTabsKeys.Traits,
          {
            title: <Trans>Traits</Trans>,
            key: TraitTabsKeys.Traits,
            content: <TraitsContent traits={asset.traits} />,
            count: asset.traits?.length,
          },
        ],
      ]),
    [asset.traits]
  )
  return <TabbedComponent tabs={TraitTabs} />
}
