import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { ScrollBarStyles } from 'components/Common'
import Row from 'components/Row'
import { GenieAsset, Trait } from 'nft/types'
import { formatEth } from 'nft/utils'
import { useMemo } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { colors } from 'theme/colors'

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

const RarityBar = styled.div<{ $color?: string }>`
  background: ${({ $color, theme }) => $color ?? theme.backgroundOutline};
  width: 2px;
  height: 10px;
  border-radius: 2px;
`

interface RarityValue {
  threshold: number
  color: string
}

enum RarityLevel {
  VeryCommon = 'Very Common',
  Common = 'Common',
  Rare = 'Rare',
  VeryRare = 'Very Rare',
  ExtremelyRare = 'Extremely Rare',
}

const RarityLevels: Map<string, RarityValue> = new Map([
  [
    RarityLevel.VeryCommon,
    {
      threshold: 0.8,
      color: colors.gray500,
    },
  ],
  [
    RarityLevel.Common,
    {
      threshold: 0.6,
      color: colors.green300,
    },
  ],
  [
    RarityLevel.Rare,
    {
      threshold: 0.4,
      color: colors.blueVibrant,
    },
  ],
  [
    RarityLevel.VeryRare,
    {
      threshold: 0.2,
      color: colors.purpleVibrant,
    },
  ],
  [
    RarityLevel.ExtremelyRare,
    {
      threshold: 0,
      color: colors.magentaVibrant,
    },
  ],
])

function getRarityLevel(rarity: number) {
  switch (true) {
    case rarity > (RarityLevels.get(RarityLevel.VeryCommon)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.VeryCommon)
    case rarity > (RarityLevels.get(RarityLevel.Common)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.Common)
    case rarity > (RarityLevels.get(RarityLevel.Rare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.Rare)
    case rarity > (RarityLevels.get(RarityLevel.VeryRare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.VeryRare)
    case rarity >= (RarityLevels.get(RarityLevel.ExtremelyRare)?.threshold ?? Number.MAX_SAFE_INTEGER):
      return RarityLevels.get(RarityLevel.ExtremelyRare)
    default:
      return RarityLevels.get(RarityLevel.VeryCommon)
  }
}

const TraitRow = ({ trait }: { trait: Trait }) => {
  // TODO: Replace with actual rarity, count, and floor price when BE supports
  const randomRarity = Math.random()
  const rarityLevel = getRarityLevel(randomRarity)
  return (
    <Row padding="12px 0px">
      <TraitValue>
        <SubheaderTiny>{trait.trait_type}</SubheaderTiny>{' '}
        <ThemedText.BodyPrimary lineHeight="20px">{trait.trait_value}</ThemedText.BodyPrimary>
      </TraitValue>
      <TraitRowValue $flex={2}>{formatEth(randomRarity * 1000)} ETH</TraitRowValue>
      <TraitRowValue>{Math.round(randomRarity * 10000)}</TraitRowValue>
      <TraitRowValue $flex={1.5} alignRight={true}>
        <Row gap="1.68px" justify="flex-end">
          {Array.from({ length: 20 }).map((_, i) => (
            <RarityBar
              key={trait.trait_value + '_bar_' + i}
              $color={i * 0.05 <= 1 - randomRarity ? rarityLevel?.color : undefined}
            />
          ))}
        </Row>
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
  padding-right: 12px;
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
